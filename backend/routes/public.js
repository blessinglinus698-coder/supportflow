import { Router } from "express";
import pool from "../db.js";
import { notifyNewTicket } from "../utils/notifications.js";
import { sendMail } from "../utils/mailer.js";
import { isNonEmptyString, isValidEmail } from "../utils/validation.js";

const router = Router();

// POST /api/public/contact — unauthenticated on purpose. Meant to be called
// from a public-facing contact form (this project's own /contact page for
// now, or a marketing site later). Finds or creates the customer by email,
// then opens a ticket from their message, same as HubSpot's form-to-contact
// or Salesforce's Web-to-Lead pattern.
router.post("/contact", async (req, res) => {
  const { name, email, phone, message } = req.body;

  if (!isNonEmptyString(name, { max: 120 })) {
    return res.status(400).json({ error: "Name is required and must be 120 characters or fewer" });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "A valid email is required" });
  }
  if (phone !== undefined && typeof phone === "string" && phone.length > 30) {
    return res.status(400).json({ error: "Phone must be 30 characters or fewer" });
  }
  if (!isNonEmptyString(message, { max: 2000 })) {
    return res.status(400).json({ error: "Message is required and must be 2000 characters or fewer" });
  }

  try {
    const { rows: existingRows } = await pool.query("SELECT * FROM customers WHERE email = $1", [
      email.trim(),
    ]);
    let customer = existingRows[0];

    if (!customer) {
      const customerId = `CUS-${Date.now()}`;
      const joined = new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" });

      await pool.query(
        `INSERT INTO customers (id, name, email, company, phone, "openTickets", "totalTickets", joined) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [customerId, name.trim(), email.trim(), "", phone?.trim() || "", 0, 0, joined]
      );
      const { rows } = await pool.query("SELECT * FROM customers WHERE id = $1", [customerId]);
      customer = rows[0];
    } else if (phone && phone.trim() && phone.trim() !== customer.phone) {
      // Existing customer, number changed since last time — keep it current.
      await pool.query("UPDATE customers SET phone = $1 WHERE id = $2", [phone.trim(), customer.id]);
    }

    const ticketId = `TCK-${Date.now()}`;
    const trimmedMessage = message.trim();
    const subject = trimmedMessage.length > 80 ? `${trimmedMessage.slice(0, 77)}...` : trimmedMessage;
    const updatedAt = new Date().toISOString();

    await pool.query(
      `INSERT INTO tickets (id, subject, customer, status, priority, "assignedTo", "updatedAt", notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [ticketId, subject, customer.name, "open", "medium", "Unassigned", updatedAt, trimmedMessage]
    );

    await pool.query(
      `UPDATE customers SET "totalTickets" = "totalTickets" + 1, "openTickets" = "openTickets" + 1 WHERE id = $1`,
      [customer.id]
    );

    const { rows: ticketRows } = await pool.query("SELECT * FROM tickets WHERE id = $1", [ticketId]);
    const newTicket = ticketRows[0];

    await notifyNewTicket(newTicket);
    await sendMail({
      to: customer.email,
      subject: "We received your message",
      html: `<p>Hi ${customer.name},</p><p>Thanks for reaching out — we've received your message and opened a support ticket. A member of our team will get back to you soon.</p><p><strong>Your message:</strong><br/>${trimmedMessage}</p>`,
    });

    res.status(201).json({ message: "Thanks! We've received your message and will be in touch soon." });
  } catch (err) {
    console.error("Failed to process contact form submission:", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

export default router;