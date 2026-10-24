import { Router } from "express";
import bcrypt from "bcryptjs";
import pool from "../db.js";
import { requireAdmin } from "../middleware/requireAuth.js";
import { sendMail } from "../utils/mailer.js";
import { isNonEmptyString, isValidEmail, PASSWORD_MAX_LENGTH } from "../utils/validation.js";

const router = Router();

function sanitize(agent) {
  if (!agent) return agent;
  const { passwordHash, ...rest } = agent;
  return rest;
}

// GET all agents
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM agents ORDER BY name ASC");
    res.json(rows.map(sanitize));
  } catch (err) {
    console.error("Failed to fetch agents:", err);
    res.status(500).json({ error: "Failed to load agents" });
  }
});

// POST a new agent (admin only, and the admin must confirm their own password)
router.post("/", requireAdmin, async (req, res) => {
  const { name, email, role, password, confirmPassword } = req.body;

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
  if (role !== undefined && !["admin", "agent"].includes(role)) {
    return res.status(400).json({ error: "Role must be 'admin' or 'agent'" });
  }
  if (!confirmPassword) {
    return res.status(400).json({ error: "Please confirm your own password to add a new agent" });
  }

  try {
    const { rows: adminRows } = await pool.query("SELECT * FROM agents WHERE id = $1", [req.agent.id]);
    const admin = adminRows[0];
    if (!admin || !bcrypt.compareSync(confirmPassword, admin.passwordHash)) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    const { rows: existingRows } = await pool.query("SELECT * FROM agents WHERE email = $1", [
      email.trim(),
    ]);
    if (existingRows[0]) {
      return res.status(409).json({ error: "An agent with this email already exists" });
    }

    const id = `AGT-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const passwordHash = bcrypt.hashSync(password, 10);

    await pool.query(
      `INSERT INTO agents (id, name, email, role, "createdAt", "passwordHash") VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, name.trim(), email.trim(), role || "agent", createdAt, passwordHash]
    );

    await sendMail({
      to: email.trim(),
      subject: "Your SupportFlow account is ready",
      html: `<p>Hi ${name.trim()},</p><p>An account has been created for you on SupportFlow.</p>
             <p><strong>Email:</strong> ${email.trim()}<br/><strong>Temporary password:</strong> ${password}</p>
             <p>Log in with these details. It's a good idea to change this password once a "change password" option is available.</p>`,
    });

    const { rows } = await pool.query("SELECT * FROM agents WHERE id = $1", [id]);
    res.status(201).json(sanitize(rows[0]));
  } catch (err) {
    console.error("Failed to create agent:", err);
    res.status(500).json({ error: "Failed to create agent" });
  }
});

// PATCH an agent's role (admin only) — promote to admin or demote to agent
router.patch("/:id/role", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!["admin", "agent"].includes(role)) {
    return res.status(400).json({ error: "Role must be 'admin' or 'agent'" });
  }
  if (id === req.agent.id) {
    return res.status(400).json({ error: "You can't change your own role" });
  }

  try {
    const { rows: existingRows } = await pool.query("SELECT * FROM agents WHERE id = $1", [id]);
    const existingAgent = existingRows[0];
    if (!existingAgent) {
      return res.status(404).json({ error: "Agent not found" });
    }

    const wasPromotedToAdmin = role === "admin" && existingAgent.role !== "admin";

    await pool.query("UPDATE agents SET role = $1 WHERE id = $2", [role, id]);
    const { rows } = await pool.query("SELECT * FROM agents WHERE id = $1", [id]);
    const updated = rows[0];

    // Role changes are baked into the JWT at login time, so a promotion
    // doesn't take effect in the agent's current session until they log
    // back in and get a fresh token. Let them know to do that.
    if (wasPromotedToAdmin) {
      await sendMail({
        to: updated.email,
        subject: "You've been made an admin on SupportFlow",
        html: `<p>Hi ${updated.name},</p><p>You've been promoted to an admin account on SupportFlow, which gives you access to the Onboarding (agent management) section.</p>
               <p><strong>To activate your new admin access, log out and log back in.</strong> Your current session won't show the new permissions until you do.</p>`,
      });
    }

    res.json(sanitize(updated));
  } catch (err) {
    console.error("Failed to update agent role:", err);
    res.status(500).json({ error: "Failed to update agent role" });
  }
});

// DELETE an agent (admin only)
router.delete("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;

  if (id === req.agent.id) {
    return res.status(400).json({ error: "You can't delete your own account" });
  }

  try {
    const { rows } = await pool.query("SELECT * FROM agents WHERE id = $1", [id]);
    if (!rows[0]) {
      return res.status(404).json({ error: "Agent not found" });
    }

    await pool.query("DELETE FROM agents WHERE id = $1", [id]);
    res.status(204).send();
  } catch (err) {
    console.error("Failed to delete agent:", err);
    res.status(500).json({ error: "Failed to delete agent" });
  }
});

export default router;