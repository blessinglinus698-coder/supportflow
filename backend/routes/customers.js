import { Router } from "express";
import pool from "../db.js";
import { isNonEmptyString, isValidEmail } from "../utils/validation.js";

const router = Router();

// GET all customers
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM customers ORDER BY name ASC");
    res.json(rows);
  } catch (err) {
    console.error("Failed to fetch customers:", err);
    res.status(500).json({ error: "Failed to load customers" });
  }
});

// POST a new customer
router.post("/", async (req, res) => {
  const { name, email, company } = req.body;

  if (!isNonEmptyString(name, { max: 120 })) {
    return res.status(400).json({ error: "Name is required and must be 120 characters or fewer" });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "A valid email is required" });
  }
  if (company !== undefined && typeof company === "string" && company.length > 150) {
    return res.status(400).json({ error: "Company must be 150 characters or fewer" });
  }

  try {
    const { rows: existingRows } = await pool.query("SELECT * FROM customers WHERE email = $1", [
      email.trim(),
    ]);
    if (existingRows[0]) {
      return res.status(409).json({ error: "A customer with this email already exists" });
    }

    const id = `CUS-${Date.now()}`;
    const joined = new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" });

    await pool.query(
      `INSERT INTO customers (id, name, email, company, "openTickets", "totalTickets", joined) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, name.trim(), email.trim(), company?.trim() || "", 0, 0, joined]
    );

    const { rows } = await pool.query("SELECT * FROM customers WHERE id = $1", [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Failed to create customer:", err);
    res.status(500).json({ error: "Failed to create customer" });
  }
});

export default router;