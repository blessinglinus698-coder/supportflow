import { Router } from "express";
import pool from "../db.js";
import { notifyNewTicket } from "../utils/notifications.js";
import { sendMail } from "../utils/mailer.js";
import { isNonEmptyString, isValidEmail } from "../utils/validation.js";

const router = Router();

// GET the contact form's public configuration — unauthenticated, since the
// /contact page itself needs this before anyone has logged in.
router.get("/contact-form-config", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT enabled, title, intro, "phoneMode", "emailMode" FROM contact_form_settings WHERE id = 'default'`
    );
    res.json(
      rows[0] || { enabled: true, title: "Contact Support", intro: "", phoneMode: "optional", emailMode: "required" }
    );
  } catch (err) {
    console.error("Failed to fetch contact form config:", err);
    res.status(500).json({ error: "Failed to load contact form configuration" });
  }
});

// POST /api/public/contact — unauthenticated on purpose. Meant to be called
// from a public-facing contact form (this project's own /contact page, or an
// external site using its own source API key). Finds or creates the customer
// by email, then opens a ticket from their message.
router.post("/contact", async (req, res) => {
  const { name, email, phone, message } = req.body;
  const sourceKey = req.headers["x-source-key"];

  try {
    const { rows: settingsRows } = await pool.query(`SELECT * FROM contact_form_settings WHERE id = 'default'`);
    const settings = settingsRows[0] || { enabled: true, phoneMode: "optional", emailMode: "required" };

    if (!settings.enabled) {
      return res.status(503).json({ error: "This form is currently unavailable." });
    }

    // Figure out which source this submission is coming from. No key means
    // it came from this project's own built-in /contact page.
    let sourceLabel = "SupportFlow Contact Page";
    if (sourceKey) {
      const { rows: sourceRows } = await pool.query(`SELECT * FROM external_sources WHERE "apiKey" = $1`, [
        sourceKey,
      ]);
      const source = sourceRows[0];
      if (!source) {
        return res.status(401).json({ error: "Invalid source key" });
      }
      if (!source.enabled) {
        return res.status(403).json({ error: "This source has been disabled" });
      }
      sourceLabel = source.label;
    }

    if (!isNonEmptyString(name, { max: 120 })) {
      return res.status(400).json({ error: "Name is required and must be 120 characters or fewer" });
    }

    const trimmedEmail = typeof email === "string" ? email.trim() : "";
    if (settings.emailMode === "required" && !isValidEmail(trimmedEmail)) {
      return res.status(400).json({ error: "A valid email is required" });
    }
    if (settings.emailMode === "optional" && trimmedEmail && !isValidEmail(trimmedEmail)) {
      return res.status(400).json({ error: "Please enter a valid email, or leave it blank" });
    }

    if (settings.phoneMode === "required" && !isNonEmptyString(phone)) {
      return res.status(400).json({ error: "Phone number is required" });
    }
    if (phone !== undefined && typeof phone === "string" && phone.length > 30) {
      return res.status(400).json({ error: "Phone must be 30 characters or fewer" });
    }
    if (!isNonEmptyString(message, { max: 2000 })) {
      return res.status(400).json({ error: "Message is required and must be 2000 characters or fewer" });
    }

    // Hidden means we don't collect it at all, regardless of what was sent.
    const effectivePhone = settings.phoneMode === "hidden" ? "" : phone?.trim() || "";

    // No email to match against (only possible when emailMode is "optional"
    // and left blank) — every such submission gets its own new customer
    // record rather than trying to find-or-create by a blank email.
    let customer;
    if (trimmedEmail) {
      const { rows: existingRows } = await pool.query("SELECT * FROM customers WHERE email = $1", [trimmedEmail]);
      customer = existingRows[0];
    }

    if (!customer) {
      const customerId = `CUS-${Date.now()}`;
      const joined = new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" });

      await pool.query(
        `INSERT INTO customers (id, name, email, company, phone, "openTickets", "totalTickets", joined) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [customerId, name.trim(), trimmedEmail, "", effectivePhone, 0, 0, joined]
      );
      const { rows } = await pool.query("SELECT * FROM customers WHERE id = $1", [customerId]);
      customer = rows[0];
    } else if (effectivePhone && effectivePhone !== customer.phone) {
      await pool.query("UPDATE customers SET phone = $1 WHERE id = $2", [effectivePhone, customer.id]);
    }

    const ticketId = `TCK-${Date.now()}`;
    const trimmedMessage = message.trim();
    const subject = trimmedMessage.length > 80 ? `${trimmedMessage.slice(0, 77)}...` : trimmedMessage;
    const updatedAt = new Date().toISOString();

    await pool.query(
      `INSERT INTO tickets (id, subject, customer, status, priority, "assignedTo", "updatedAt", "createdAt", notes, source) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        ticketId,
        subject,
        customer.name,
        "open",
        "medium",
        "Unassigned",
        updatedAt,
        updatedAt,
        trimmedMessage,
        sourceLabel,
      ]
    );

    await pool.query(
      `UPDATE customers SET "totalTickets" = "totalTickets" + 1, "openTickets" = "openTickets" + 1 WHERE id = $1`,
      [customer.id]
    );

    // Seeds the Inbox conversation thread with the customer's original
    // message, so it shows up there distinct from the ticket's (internal)
    // notes field.
    await pool.query(
      `INSERT INTO ticket_messages (id, "ticketId", sender, "authorName", body, "createdAt") VALUES ($1, $2, $3, $4, $5, $6)`,
      [`MSG-${Date.now()}`, ticketId, "customer", customer.name, trimmedMessage, updatedAt]
    );

    const { rows: ticketRows } = await pool.query("SELECT * FROM tickets WHERE id = $1", [ticketId]);
    const newTicket = ticketRows[0];

    await notifyNewTicket(newTicket);
    // No email on file (an optional, blank email submission) — nothing to
    // send a confirmation to.
    if (customer.email) {
      await sendMail({
        to: customer.email,
        subject: "We received your message",
        html: `<p>Hi ${customer.name},</p><p>Thanks for reaching out — we've received your message and opened a support ticket. A member of our team will get back to you soon.</p><p><strong>Your message:</strong><br/>${trimmedMessage}</p>`,
      });
    }

    res.status(201).json({ message: "Thanks! We've received your message and will be in touch soon." });
  } catch (err) {
    console.error("Failed to process contact form submission:", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

export default router;