import { Router } from "express";
import pool from "../db.js";
import Anthropic from "@anthropic-ai/sdk";
import { notifyNewTicket, notifyTicketResolved, notifyTicketAssigned } from "../utils/notifications.js";
import { sendMail } from "../utils/mailer.js";
import { isNonEmptyString, isOneOf, isValidEmail } from "../utils/validation.js";

const router = Router();

const STATUSES = ["open", "pending", "resolved", "closed"];
// "urgent" was already offered in the New Ticket and ticket-detail priority
// dropdowns (and Badges.tsx already has styling for it) but was missing here,
// so picking it always failed validation. Added to match what the UI offers.
const PRIORITIES = ["low", "medium", "high", "urgent"];
const OPEN_STATUSES = ["open", "pending"];

function isOpenStatus(status) {
  return OPEN_STATUSES.includes(status);
}

// Keeps a customer's openTickets/totalTickets counts in sync. Best-effort:
// looks the customer up by name (the only link tickets currently have to a
// customer record), and silently does nothing if there's no match.
async function adjustCustomerCounts(customerName, { totalDelta = 0, openDelta = 0 } = {}) {
  try {
    const { rows } = await pool.query("SELECT * FROM customers WHERE name = $1", [customerName]);
    const customer = rows[0];
    if (!customer) return;

    const newTotal = Math.max(0, customer.totalTickets + totalDelta);
    const newOpen = Math.max(0, customer.openTickets + openDelta);

    await pool.query(`UPDATE customers SET "totalTickets" = $1, "openTickets" = $2 WHERE id = $3`, [
      newTotal,
      newOpen,
      customer.id,
    ]);
  } catch (err) {
    console.error("Failed to adjust customer ticket counts:", err);
  }
}

// GET all tickets
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM tickets ORDER BY "updatedAt" DESC`);
    res.json(rows);
  } catch (err) {
    console.error("Failed to fetch tickets:", err);
    res.status(500).json({ error: "Failed to load tickets" });
  }
});

// AI Replies

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// POST generate an AI-suggested reply for a ticket
router.post("/:id/suggest-reply", async (req, res) => {
  const { id } = req.params;

  if (!anthropic) {
    return res.status(503).json({ error: "AI replies aren't configured on this server" });
  }

  try {
    const { rows } = await pool.query("SELECT * FROM tickets WHERE id = $1", [id]);
    const ticket = rows[0];
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `You are a helpful customer support agent. Draft a short, friendly reply to this support ticket.

Subject: ${ticket.subject}
Customer: ${ticket.customer}
Priority: ${ticket.priority}
Internal notes from the agent: ${ticket.notes || "None"}

Write only the reply text, no greeting like "Dear customer" needed beyond a simple hello, and no sign-off with a name.`,
        },
      ],
    });

    const replyText = message.content[0].text;
    res.json({ reply: replyText });
  } catch (err) {
    console.error("AI suggestion error:", err.message);
    res.status(502).json({ error: "The AI service couldn't generate a reply. Try again in a moment." });
  }
});

// POST a new ticket
router.post("/", async (req, res) => {
  const { subject, customer, customerEmail, priority, assignedTo } = req.body;

  if (!isNonEmptyString(subject, { max: 200 })) {
    return res.status(400).json({ error: "Subject is required and must be 200 characters or fewer" });
  }
  if (!isNonEmptyString(customer, { max: 120 })) {
    return res.status(400).json({ error: "Customer is required and must be 120 characters or fewer" });
  }
  if (!isValidEmail(customerEmail)) {
    return res.status(400).json({ error: "A valid customer email is required" });
  }
  if (priority !== undefined && !isOneOf(priority, PRIORITIES)) {
    return res.status(400).json({ error: `Priority must be one of: ${PRIORITIES.join(", ")}` });
  }
  if (assignedTo !== undefined && typeof assignedTo === "string" && assignedTo.length > 120) {
    return res.status(400).json({ error: "Assigned to must be 120 characters or fewer" });
  }

  try {
    const trimmedEmail = customerEmail.trim();

    // Find-or-create the customer by email — same pattern as the public
    // contact form — so creating a ticket here never produces a duplicate
    // customer record. If a match exists, its stored name is used on the
    // ticket (not whatever the agent typed this time), so every ticket for
    // this customer ends up under one consistent name.
    const { rows: existingCustomerRows } = await pool.query("SELECT * FROM customers WHERE email = $1", [
      trimmedEmail,
    ]);
    let customerRecord = existingCustomerRows[0];

    if (!customerRecord) {
      const customerId = `CUS-${Date.now()}`;
      const joined = new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" });

      await pool.query(
        `INSERT INTO customers (id, name, email, company, "openTickets", "totalTickets", joined) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [customerId, customer.trim(), trimmedEmail, "", 0, 0, joined]
      );
      const { rows } = await pool.query("SELECT * FROM customers WHERE id = $1", [customerId]);
      customerRecord = rows[0];
    }

    const id = `TCK-${Date.now()}`;
    const status = "open";
    const updatedAt = new Date().toISOString();

    await pool.query(
      `INSERT INTO tickets (id, subject, customer, status, priority, "assignedTo", "updatedAt", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        id,
        subject.trim(),
        customerRecord.name,
        status,
        priority || "medium",
        assignedTo || "Unassigned",
        updatedAt,
        updatedAt,
      ]
    );

    const { rows } = await pool.query("SELECT * FROM tickets WHERE id = $1", [id]);
    const newTicket = rows[0];

    await adjustCustomerCounts(customerRecord.name, { totalDelta: 1, openDelta: 1 });
    await notifyNewTicket(newTicket);
    await notifyTicketAssigned(newTicket, "Unassigned");

    res.status(201).json(newTicket);
  } catch (err) {
    console.error("Failed to create ticket:", err);
    res.status(500).json({ error: "Failed to create ticket" });
  }
});

// PATCH update a ticket (status, notes, priority, and/or assignedTo)
router.patch("/:id", async (req, res) => {
  const { status, notes, priority, assignedTo } = req.body;
  const { id } = req.params;

  if (status !== undefined && !isOneOf(status, STATUSES)) {
    return res.status(400).json({ error: `Status must be one of: ${STATUSES.join(", ")}` });
  }
  if (notes !== undefined && typeof notes === "string" && notes.length > 5000) {
    return res.status(400).json({ error: "Notes must be 5000 characters or fewer" });
  }
  if (priority !== undefined && !isOneOf(priority, PRIORITIES)) {
    return res.status(400).json({ error: `Priority must be one of: ${PRIORITIES.join(", ")}` });
  }
  if (assignedTo !== undefined && typeof assignedTo === "string" && assignedTo.length > 120) {
    return res.status(400).json({ error: "Assigned to must be 120 characters or fewer" });
  }

  try {
    const { rows: existingRows } = await pool.query("SELECT * FROM tickets WHERE id = $1", [id]);
    const ticket = existingRows[0];
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    const newStatus = status !== undefined ? status : ticket.status;
    const newNotes = notes !== undefined ? notes : ticket.notes;
    const newPriority = priority !== undefined ? priority : ticket.priority;
    const newAssignedTo = assignedTo !== undefined ? assignedTo : ticket.assignedTo;
    const wasResolved = ticket.status === "resolved";
    const previousAssignedTo = ticket.assignedTo;
    const justResolved = newStatus === "resolved" && !wasResolved;
    const newResolvedAt = justResolved ? new Date().toISOString() : ticket.resolvedAt;

    await pool.query(
      `UPDATE tickets SET status = $1, notes = $2, priority = $3, "assignedTo" = $4, "updatedAt" = $5, "resolvedAt" = $6 WHERE id = $7`,
      [newStatus, newNotes, newPriority, newAssignedTo, new Date().toISOString(), newResolvedAt, id]
    );

    const { rows } = await pool.query("SELECT * FROM tickets WHERE id = $1", [id]);
    const updated = rows[0];

    if (newStatus !== ticket.status) {
      const wasOpen = isOpenStatus(ticket.status);
      const isOpenNow = isOpenStatus(newStatus);
      if (wasOpen && !isOpenNow) {
        await adjustCustomerCounts(updated.customer, { openDelta: -1 });
      } else if (!wasOpen && isOpenNow) {
        await adjustCustomerCounts(updated.customer, { openDelta: 1 });
      }
    }

    if (newStatus === "resolved" && !wasResolved) {
      await notifyTicketResolved(updated);
    }

    if (newAssignedTo !== previousAssignedTo) {
      await notifyTicketAssigned(updated, previousAssignedTo);
    }

    res.json(updated);
  } catch (err) {
    console.error("Failed to update ticket:", err);
    res.status(500).json({ error: "Failed to update ticket" });
  }
});

// GET the Inbox conversation thread for a ticket
router.get("/:id/messages", async (req, res) => {
  const { id } = req.params;
  try {
    const { rows: ticketRows } = await pool.query("SELECT * FROM tickets WHERE id = $1", [id]);
    if (!ticketRows[0]) return res.status(404).json({ error: "Ticket not found" });

    const { rows } = await pool.query(
      `SELECT * FROM ticket_messages WHERE "ticketId" = $1 ORDER BY "createdAt" ASC`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error("Failed to fetch ticket messages:", err);
    res.status(500).json({ error: "Failed to load messages" });
  }
});

// POST a reply from the Inbox — logs it in the thread and emails the
// matched customer (best-effort: if no customer record/email is on file,
// the reply still gets logged, it just isn't emailed anywhere).
router.post("/:id/messages", async (req, res) => {
  const { id } = req.params;
  const { body } = req.body;

  if (!isNonEmptyString(body, { max: 5000 })) {
    return res.status(400).json({ error: "A message is required and must be 5000 characters or fewer" });
  }

  try {
    const { rows: ticketRows } = await pool.query("SELECT * FROM tickets WHERE id = $1", [id]);
    const ticket = ticketRows[0];
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    const messageId = `MSG-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const authorName = req.agent?.name || "Agent";
    const trimmedBody = body.trim();

    await pool.query(
      `INSERT INTO ticket_messages (id, "ticketId", sender, "authorName", body, "createdAt") VALUES ($1, $2, $3, $4, $5, $6)`,
      [messageId, id, "agent", authorName, trimmedBody, createdAt]
    );

    // Same best-effort name-match used everywhere else to link a ticket to
    // a customer record (tickets have no formal foreign key to customers).
    const { rows: customerRows } = await pool.query("SELECT * FROM customers WHERE name = $1", [
      ticket.customer,
    ]);
    const customer = customerRows[0];
    if (customer?.email) {
      await sendMail({
        to: customer.email,
        subject: `Re: ${ticket.subject}`,
        html: `<p>${trimmedBody.replace(/\n/g, "<br/>")}</p>`,
      });
    }

    const { rows } = await pool.query("SELECT * FROM ticket_messages WHERE id = $1", [messageId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Failed to send reply:", err);
    res.status(500).json({ error: "Failed to send reply" });
  }
});

// DELETE a ticket
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query("SELECT * FROM tickets WHERE id = $1", [id]);
    const ticket = rows[0];
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    await pool.query("DELETE FROM tickets WHERE id = $1", [id]);

    const openDelta = isOpenStatus(ticket.status) ? -1 : 0;
    await adjustCustomerCounts(ticket.customer, { totalDelta: -1, openDelta });

    res.status(204).send();
  } catch (err) {
    console.error("Failed to delete ticket:", err);
    res.status(500).json({ error: "Failed to delete ticket" });
  }
});

export default router;