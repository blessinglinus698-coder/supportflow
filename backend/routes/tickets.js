import { Router } from "express";
import db from "../db.js";
import Anthropic from "@anthropic-ai/sdk";

const router = Router();

// GET all tickets
router.get("/", (req, res) => {
  const tickets = db.prepare("SELECT * FROM tickets ORDER BY updatedAt DESC").all();
  res.json(tickets);
});

// AI Replies

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// POST generate an AI-suggested reply for a ticket
router.post("/:id/suggest-reply", async (req, res) => {
  const { id } = req.params;
  const ticket = db.prepare("SELECT * FROM tickets WHERE id = ?").get(id);

  if (!ticket) return res.status(404).json({ error: "Ticket not found" });

  try {
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
    res.status(500).json({ error: "Failed to generate reply" });
  }
});


// POST a new ticket
router.post("/", (req, res) => {
  const { subject, customer, priority, assignedTo } = req.body;

  if (!subject || !customer) {
    return res.status(400).json({ error: "Subject and customer are required" });
  }

  const id = `TCK-${Date.now()}`;
  const status = "open";
  const updatedAt = new Date().toISOString();

  db.prepare(
    "INSERT INTO tickets (id, subject, customer, status, priority, assignedTo, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(id, subject, customer, status, priority || "medium", assignedTo || "Unassigned", updatedAt);

  const newTicket = db.prepare("SELECT * FROM tickets WHERE id = ?").get(id);
  res.status(201).json(newTicket);
});

// PATCH update a ticket (status and/or notes)
router.patch("/:id", (req, res) => {
  const { status, notes } = req.body;
  const { id } = req.params;

  const ticket = db.prepare("SELECT * FROM tickets WHERE id = ?").get(id);
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });

  const newStatus = status !== undefined ? status : ticket.status;
  const newNotes = notes !== undefined ? notes : ticket.notes;

  db.prepare("UPDATE tickets SET status = ?, notes = ?, updatedAt = ? WHERE id = ?").run(
    newStatus,
    newNotes,
    new Date().toISOString(),
    id
  );

  const updated = db.prepare("SELECT * FROM tickets WHERE id = ?").get(id);
  res.json(updated);
});

// DELETE a ticket
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM tickets WHERE id = ?").run(id);
  res.status(204).send();
});

export default router;