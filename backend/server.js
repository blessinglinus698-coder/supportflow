import "dotenv/config";
import express from "express";
import cors from "cors";
import ticketsRouter from "./routes/tickets.js";
import customersRouter from "./routes/customers.js";
import agentsRouter from "./routes/agents.js";
import authRouter from "./routes/auth.js";
import publicRouter from "./routes/public.js";
import notificationsRouter from "./routes/notifications.js";
import { requireAuth } from "./middleware/requireAuth.js";
import { initDb } from "./db.js";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use("/api/auth", authRouter);

// Unauthenticated on purpose — this is the public contact-form endpoint.
app.use("/api/public", publicRouter);

app.use("/api/tickets", requireAuth, ticketsRouter);
app.use("/api/customers", requireAuth, customersRouter);
app.use("/api/agents", requireAuth, agentsRouter);
app.use("/api/notifications", requireAuth, notificationsRouter);

app.get("/", (req, res) => {
  res.send("SupportFlow API is running.");
});

// Unknown API route
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Catches anything a route didn't handle itself (bad JSON body, unexpected
// errors) and returns clean JSON instead of Express's default HTML error page
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

// The database connection is remote (Postgres on Neon), so it has to be set
// up before the server starts accepting requests.
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });