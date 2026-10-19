import { Router } from "express";
import bcrypt from "bcryptjs";
import db from "../db.js";
import { requireAdmin } from "../middleware/requireAuth.js";
import { isValidEmail, cleanString } from "../utils/validators.js";

const router = Router();

function sanitize(agent) {
  if (!agent) return agent;
  const { passwordHash, ...rest } = agent;
  return rest;
}

// GET all agents
router.get("/", (req, res) => {
  const agents = db.prepare("SELECT * FROM agents ORDER BY name ASC").all();
  res.json(agents.map(sanitize));
});

// POST a new agent (admin only, and the admin must confirm their own password)
router.post("/", requireAdmin, (req, res) => {
  const name = cleanString(req.body.name, 100);
  const email = cleanString(req.body.email, 150).toLowerCase();
  const { password, confirmPassword } = req.body;
  const role = req.body.role === "admin" ? "admin" : "agent";

  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "A valid email is required" });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }
  if (!confirmPassword) {
    return res.status(400).json({ error: "Please confirm your own password to add a new agent" });
  }

  const admin = db.prepare("SELECT * FROM agents WHERE id = ?").get(req.agent.id);
  if (!admin || !bcrypt.compareSync(confirmPassword, admin.passwordHash)) {
    return res.status(401).json({ error: "Incorrect password" });
  }

  const existing = db.prepare("SELECT * FROM agents WHERE email = ?").get(email);
  if (existing) {
    return res.status(409).json({ error: "An agent with this email already exists" });
  }

  const id = `AGT-${Date.now()}`;
  const createdAt = new Date().toISOString();
  const passwordHash = bcrypt.hashSync(password, 10);

  db.prepare(
    "INSERT INTO agents (id, name, email, role, createdAt, passwordHash) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(id, name, email, role, createdAt, passwordHash);

  const newAgent = db.prepare("SELECT * FROM agents WHERE id = ?").get(id);
  res.status(201).json(sanitize(newAgent));
});

// PATCH an agent's role (admin only) — promote to admin or demote to agent
router.patch("/:id/role", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!["admin", "agent"].includes(role)) {
    return res.status(400).json({ error: "Role must be 'admin' or 'agent'" });
  }
  if (id === req.agent.id) {
    return res.status(400).json({ error: "You can't change your own role" });
  }

  const agent = db.prepare("SELECT * FROM agents WHERE id = ?").get(id);
  if (!agent) {
    return res.status(404).json({ error: "Agent not found" });
  }

  db.prepare("UPDATE agents SET role = ? WHERE id = ?").run(role, id);
  const updated = db.prepare("SELECT * FROM agents WHERE id = ?").get(id);
  res.json(sanitize(updated));
});

// DELETE an agent (admin only)
router.delete("/:id", requireAdmin, (req, res) => {
  const { id } = req.params;

  if (id === req.agent.id) {
    return res.status(400).json({ error: "You can't delete your own account" });
  }

  const agent = db.prepare("SELECT * FROM agents WHERE id = ?").get(id);
  if (!agent) {
    return res.status(404).json({ error: "Agent not found" });
  }

  db.prepare("DELETE FROM agents WHERE id = ?").run(id);
  res.status(204).send();
});

export default router;