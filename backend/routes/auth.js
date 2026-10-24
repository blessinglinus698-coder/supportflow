import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import pool from "../db.js";
import { sendMail } from "../utils/mailer.js";
import { isNonEmptyString, isValidEmail, PASSWORD_MAX_LENGTH } from "../utils/validation.js";

const router = Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!isValidEmail(email) || !isNonEmptyString(password)) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const { rows } = await pool.query("SELECT * FROM agents WHERE email = $1", [email.trim()]);
    const agent = rows[0];
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
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!isNonEmptyString(name, { max: 120 })) {
    return res.status(400).json({ error: "Name is required and must be 120 characters or fewer" });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "A valid email is required" });
  }
  if (!isNonEmptyString(password) || password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return res.status(400).json({ error: `Password must be ${PASSWORD_MAX_LENGTH} characters or fewer` });
  }

  try {
    const { rows: existingRows } = await pool.query("SELECT * FROM agents WHERE email = $1", [
      email.trim(),
    ]);
    if (existingRows[0]) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    // The very first account on a fresh install becomes admin automatically.
    // Everyone after that signs up as a regular agent and must be promoted by an admin.
    const { rows: countRows } = await pool.query("SELECT COUNT(*) AS count FROM agents");
    const agentCount = parseInt(countRows[0].count, 10);
    const role = agentCount === 0 ? "admin" : "agent";

    const id = `AGT-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const passwordHash = bcrypt.hashSync(password, 10);

    await pool.query(
      `INSERT INTO agents (id, name, email, role, "createdAt", "passwordHash") VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, name.trim(), email.trim(), role, createdAt, passwordHash]
    );

    // Email verification: generate a one-time token, store only its hash,
    // and email the raw token as a link. Verifying doesn't block login —
    // it just marks the account's emailVerified flag.
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await pool.query(
      `UPDATE agents SET "verificationToken" = $1, "verificationTokenExpires" = $2 WHERE id = $3`,
      [tokenHash, expires, id]
    );

    const verifyUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email?token=${rawToken}`;
    await sendMail({
      to: email.trim(),
      subject: "Verify your SupportFlow account",
      html: `<p>Hi ${name.trim()},</p><p>Welcome to SupportFlow! Please verify your email address by clicking the link below:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>This link expires in 24 hours.</p>`,
    });

    const token = jwt.sign({ id, name: name.trim(), email: email.trim(), role }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({ token, agent: { id, name: name.trim(), email: email.trim(), role } });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

router.post("/verify-email", async (req, res) => {
  const { token } = req.body;

  if (!isNonEmptyString(token)) {
    return res.status(400).json({ error: "Verification token is required" });
  }

  try {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const { rows } = await pool.query(`SELECT * FROM agents WHERE "verificationToken" = $1`, [tokenHash]);
    const agent = rows[0];

    if (!agent) {
      return res.status(400).json({ error: "This verification link is invalid or has already been used" });
    }
    if (agent.verificationTokenExpires && new Date(agent.verificationTokenExpires) < new Date()) {
      return res.status(400).json({ error: "This verification link has expired" });
    }

    await pool.query(
      `UPDATE agents SET "emailVerified" = true, "verificationToken" = NULL, "verificationTokenExpires" = NULL WHERE id = $1`,
      [agent.id]
    );

    res.json({ message: "Email verified successfully" });
  } catch (err) {
    console.error("Email verification error:", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
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