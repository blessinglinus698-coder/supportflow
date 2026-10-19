import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db.js";
import { isValidEmail, cleanString } from "../utils/validators.js";

const router = Router();

router.post("/login", (req, res) => {
  const email = cleanString(req.body.email, 150).toLowerCase();
  const { password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const agent = db.prepare("SELECT * FROM agents WHERE email = ?").get(email);
  if (!agent || !agent.passwordHash) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const matches = bcrypt.compareSync(password, agent.passwordHash);
  if (!matches) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = jwt.sign(
    { id: agent.id, name: agent.name, email: agent.email, role: agent.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    agent: { id: agent.id, name: agent.name, email: agent.email, role: agent.role },
  });
});

router.post("/signup", (req, res) => {
  const name = cleanString(req.body.name, 100);
  const email = cleanString(req.body.email, 150).toLowerCase();
  const { password } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "A valid email is required" });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  const existing = db.prepare("SELECT * FROM agents WHERE email = ?").get(email);
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists" });
  }

  // The very first account on a fresh install becomes admin automatically.
  // Everyone after that signs up as a regular agent and must be promoted by an admin.
  const agentCount = db.prepare("SELECT COUNT(*) as count FROM agents").get().count;
  const role = agentCount === 0 ? "admin" : "agent";

  const id = `AGT-${Date.now()}`;
  const createdAt = new Date().toISOString();
  const passwordHash = bcrypt.hashSync(password, 10);

  db.prepare(
    "INSERT INTO agents (id, name, email, role, createdAt, passwordHash) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(id, name, email, role, createdAt, passwordHash);

  const token = jwt.sign(
    { id, name, email, role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.status(201).json({ token, agent: { id, name, email, role } });
});

router.get("/me", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }
  const token = authHeader.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ agent: payload });
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

export default router;