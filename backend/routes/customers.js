import { Router } from "express";
import db from "../db.js";

const router = Router();

// GET all customers
router.get("/", (req, res) => {
  const customers = db.prepare("SELECT * FROM customers ORDER BY name ASC").all();
  res.json(customers);
});

// POST a new customer
router.post("/", (req, res) => {
  const { name, email, company } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  const id = `CUS-${Date.now()}`;
  const joined = new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" });

  db.prepare(
    "INSERT INTO customers (id, name, email, company, openTickets, totalTickets, joined) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(id, name, email, company || "", 0, 0, joined);

  const newCustomer = db.prepare("SELECT * FROM customers WHERE id = ?").get(id);
  res.status(201).json(newCustomer);
});

export default router;