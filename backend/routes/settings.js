import { Router } from "express";
import crypto from "crypto";
import pool from "../db.js";
import { requireAdmin } from "../middleware/requireAuth.js";
import { isNonEmptyString, isOneOf } from "../utils/validation.js";

const router = Router();

// Everything in this file is admin-only.
router.use(requireAdmin);

const PHONE_MODES = ["required", "optional", "hidden"];
// Email has no "hidden" option — it's how a submission is matched to a
// customer record, so dropping it entirely would break that lookup.
const EMAIL_MODES = ["required", "optional"];

// GET current contact form settings
router.get("/contact-form", async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM contact_form_settings WHERE id = 'default'`);
    res.json(rows[0]);
  } catch (err) {
    console.error("Failed to fetch contact form settings:", err);
    res.status(500).json({ error: "Failed to load settings" });
  }
});

// PATCH update contact form settings
router.patch("/contact-form", async (req, res) => {
  const { enabled, title, intro, phoneMode, emailMode } = req.body;

  if (enabled !== undefined && typeof enabled !== "boolean") {
    return res.status(400).json({ error: "enabled must be true or false" });
  }
  if (title !== undefined && !isNonEmptyString(title, { max: 120 })) {
    return res.status(400).json({ error: "Title is required and must be 120 characters or fewer" });
  }
  if (intro !== undefined && typeof intro === "string" && intro.length > 500) {
    return res.status(400).json({ error: "Intro must be 500 characters or fewer" });
  }
  if (phoneMode !== undefined && !isOneOf(phoneMode, PHONE_MODES)) {
    return res.status(400).json({ error: `phoneMode must be one of: ${PHONE_MODES.join(", ")}` });
  }
  if (emailMode !== undefined && !isOneOf(emailMode, EMAIL_MODES)) {
    return res.status(400).json({ error: `emailMode must be one of: ${EMAIL_MODES.join(", ")}` });
  }

  try {
    const { rows: existingRows } = await pool.query(`SELECT * FROM contact_form_settings WHERE id = 'default'`);
    const current = existingRows[0];

    const newEnabled = enabled !== undefined ? enabled : current.enabled;
    const newTitle = title !== undefined ? title.trim() : current.title;
    const newIntro = intro !== undefined ? intro.trim() : current.intro;
    const newPhoneMode = phoneMode !== undefined ? phoneMode : current.phoneMode;
    const newEmailMode = emailMode !== undefined ? emailMode : current.emailMode;

    await pool.query(
      `UPDATE contact_form_settings SET enabled = $1, title = $2, intro = $3, "phoneMode" = $4, "emailMode" = $5 WHERE id = 'default'`,
      [newEnabled, newTitle, newIntro, newPhoneMode, newEmailMode]
    );

    const { rows } = await pool.query(`SELECT * FROM contact_form_settings WHERE id = 'default'`);
    res.json(rows[0]);
  } catch (err) {
    console.error("Failed to update contact form settings:", err);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// GET all external sources
router.get("/external-sources", async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM external_sources ORDER BY "createdAt" DESC`);
    res.json(rows);
  } catch (err) {
    console.error("Failed to fetch external sources:", err);
    res.status(500).json({ error: "Failed to load external sources" });
  }
});

// POST create a new external source — generates its API key
router.post("/external-sources", async (req, res) => {
  const { label } = req.body;

  if (!isNonEmptyString(label, { max: 120 })) {
    return res.status(400).json({ error: "Label is required and must be 120 characters or fewer" });
  }

  try {
    const id = `SRC-${Date.now()}`;
    const apiKey = crypto.randomBytes(24).toString("hex");
    const createdAt = new Date().toISOString();

    await pool.query(
      `INSERT INTO external_sources (id, label, "apiKey", enabled, "createdAt") VALUES ($1, $2, $3, true, $4)`,
      [id, label.trim(), apiKey, createdAt]
    );

    const { rows } = await pool.query("SELECT * FROM external_sources WHERE id = $1", [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Failed to create external source:", err);
    res.status(500).json({ error: "Failed to create external source" });
  }
});

// PATCH toggle an external source on/off (or rename it)
router.patch("/external-sources/:id", async (req, res) => {
  const { id } = req.params;
  const { enabled, label } = req.body;

  if (enabled !== undefined && typeof enabled !== "boolean") {
    return res.status(400).json({ error: "enabled must be true or false" });
  }
  if (label !== undefined && !isNonEmptyString(label, { max: 120 })) {
    return res.status(400).json({ error: "Label must be 120 characters or fewer" });
  }

  try {
    const { rows: existingRows } = await pool.query("SELECT * FROM external_sources WHERE id = $1", [id]);
    const existing = existingRows[0];
    if (!existing) return res.status(404).json({ error: "Source not found" });

    const newEnabled = enabled !== undefined ? enabled : existing.enabled;
    const newLabel = label !== undefined ? label.trim() : existing.label;

    await pool.query(`UPDATE external_sources SET enabled = $1, label = $2 WHERE id = $3`, [
      newEnabled,
      newLabel,
      id,
    ]);

    const { rows } = await pool.query("SELECT * FROM external_sources WHERE id = $1", [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error("Failed to update external source:", err);
    res.status(500).json({ error: "Failed to update external source" });
  }
});

// DELETE an external source
router.delete("/external-sources/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query("SELECT * FROM external_sources WHERE id = $1", [id]);
    if (!rows[0]) return res.status(404).json({ error: "Source not found" });

    await pool.query("DELETE FROM external_sources WHERE id = $1", [id]);
    res.status(204).send();
  } catch (err) {
    console.error("Failed to delete external source:", err);
    res.status(500).json({ error: "Failed to delete external source" });
  }
});

export default router;