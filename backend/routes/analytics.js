import { Router } from "express";
import pool from "../db.js";

const router = Router();

const OPEN_STATUSES = ["open", "pending"];
const STATUSES = ["open", "pending", "resolved", "closed"];
const PRIORITIES = ["low", "medium", "high", "urgent"];

// GET aggregated ticket metrics for a date range.
// Query params: range = "7" | "30" | "90" | "custom"
//               from, to = ISO date strings, required when range is "custom"
router.get("/", async (req, res) => {
  const { range = "30", from, to } = req.query;

  const now = new Date();
  let startDate;
  let endDate = to ? new Date(String(to)) : now;

  if (range === "custom") {
    if (!from) {
      return res.status(400).json({ error: "A start date is required for a custom range" });
    }
    startDate = new Date(String(from));
  } else {
    const days = parseInt(String(range), 10);
    const safeDays = Number.isFinite(days) && days > 0 ? days : 30;
    startDate = new Date(now.getTime() - safeDays * 24 * 60 * 60 * 1000);
  }

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return res.status(400).json({ error: "Invalid date range" });
  }
  if (startDate.getTime() > endDate.getTime()) {
    return res.status(400).json({ error: "Start date must be before end date" });
  }

  // Make the end date inclusive of its whole day when it came in as a bare
  // date (e.g. "2026-10-30" from a <input type="date">).
  if (to && /^\d{4}-\d{2}-\d{2}$/.test(String(to))) {
    endDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000 - 1);
  }

  const startISO = startDate.toISOString();
  const endISO = endDate.toISOString();

  try {
    const { rows: ticketsInRange } = await pool.query(
      `SELECT * FROM tickets WHERE "createdAt" >= $1 AND "createdAt" <= $2`,
      [startISO, endISO]
    );

    const byDayMap = {};
    const statusBreakdown = Object.fromEntries(STATUSES.map((s) => [s, 0]));
    const priorityBreakdown = Object.fromEntries(PRIORITIES.map((p) => [p, 0]));
    const byAgentMap = {};
    const byCustomerMap = {};
    let openCount = 0;
    let resolvedCount = 0;
    let resolutionHoursSum = 0;
    let resolutionSampleCount = 0;

    for (const t of ticketsInRange) {
      const day = (t.createdAt || "").slice(0, 10);
      if (day) byDayMap[day] = (byDayMap[day] || 0) + 1;

      if (statusBreakdown[t.status] !== undefined) statusBreakdown[t.status]++;
      if (priorityBreakdown[t.priority] !== undefined) priorityBreakdown[t.priority]++;

      const agentKey = t.assignedTo || "Unassigned";
      byAgentMap[agentKey] = (byAgentMap[agentKey] || 0) + 1;

      byCustomerMap[t.customer] = (byCustomerMap[t.customer] || 0) + 1;

      if (OPEN_STATUSES.includes(t.status)) openCount++;
      if (t.status === "resolved" || t.status === "closed") resolvedCount++;

      if (t.resolvedAt && t.createdAt) {
        const hours = (new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime()) / 3600000;
        if (hours >= 0) {
          resolutionHoursSum += hours;
          resolutionSampleCount++;
        }
      }
    }

    const ticketsOverTime = Object.entries(byDayMap)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([date, count]) => ({ date, count }));

    const byAgent = Object.entries(byAgentMap)
      .sort(([, a], [, b]) => b - a)
      .map(([name, count]) => ({ name, count }));

    const topCustomers = Object.entries(byCustomerMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    res.json({
      range: { from: startISO, to: endISO },
      totals: {
        totalTickets: ticketsInRange.length,
        openTickets: openCount,
        resolvedTickets: resolvedCount,
      },
      avgResolutionHours: resolutionSampleCount > 0 ? resolutionHoursSum / resolutionSampleCount : null,
      ticketsOverTime,
      statusBreakdown,
      priorityBreakdown,
      byAgent,
      topCustomers,
    });
  } catch (err) {
    console.error("Failed to compute analytics:", err);
    res.status(500).json({ error: "Failed to load analytics" });
  }
});

export default router;