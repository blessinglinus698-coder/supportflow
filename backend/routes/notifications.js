import { Router } from "express";
import pool from "../db.js";

const router = Router();

// GET the current agent's notifications, most recent first
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM notifications WHERE "agentId" = $1 ORDER BY "createdAt" DESC LIMIT 50`,
      [req.agent.id]
    );
    res.json(rows);
  } catch (err) {
    console.error("Failed to fetch notifications:", err);
    res.status(500).json({ error: "Failed to load notifications" });
  }
});

// PATCH mark one notification as read
router.patch("/:id/read", async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(`SELECT * FROM notifications WHERE id = $1 AND "agentId" = $2`, [
      id,
      req.agent.id,
    ]);
    if (!rows[0]) return res.status(404).json({ error: "Notification not found" });

    await pool.query(`UPDATE notifications SET read = true WHERE id = $1`, [id]);
    res.json({ message: "Marked as read" });
  } catch (err) {
    console.error("Failed to update notification:", err);
    res.status(500).json({ error: "Failed to update notification" });
  }
});

// PATCH mark all of the current agent's notifications as read
router.patch("/read-all", async (req, res) => {
  try {
    await pool.query(`UPDATE notifications SET read = true WHERE "agentId" = $1 AND read = false`, [
      req.agent.id,
    ]);
    res.json({ message: "All marked as read" });
  } catch (err) {
    console.error("Failed to mark all notifications as read:", err);
    res.status(500).json({ error: "Failed to update notifications" });
  }
});

export default router;