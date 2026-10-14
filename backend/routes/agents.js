import { Router } from "express";
import db from "../db.js";

const router = Router();

// GET all agents
router.get("/", (req, res) => {
  const agents = db.prepare("SELECT * FROM agents ORDER BY name ASC").all();
  res.json(agents);
});

// POST a new agent
router.post("/", (req, res) => {
  const { name, email, role } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  const existing = db.prepare("SELECT * FROM agents WHERE email = ?").get(email);
  if (existing) {
    return res.status(409).json({ error: "An agent with this email already exists" });
  }

  const id = `AGT-${Date.now()}`;
  const createdAt = new Date().toISOString();

  db.prepare(
    "INSERT INTO agents (id, name, email, role, createdAt) VALUES (?, ?, ?, ?, ?)"
  ).run(id, name, email, role || "agent", createdAt);

  const newAgent = db.prepare("SELECT * FROM agents WHERE id = ?").get(id);
  res.status(201).json(newAgent);
});

// DELETE an agent
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM agents WHERE id = ?").run(id);
  res.status(204).send();
});

export default router;