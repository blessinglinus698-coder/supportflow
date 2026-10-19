import "dotenv/config";
import express from "express";
import cors from "cors";
import ticketsRouter from "./routes/tickets.js";
import customersRouter from "./routes/customers.js";
import agentsRouter from "./routes/agents.js";
import authRouter from "./routes/auth.js";
import { requireAuth } from "./middleware/requireAuth.js";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRouter);

app.use("/api/tickets", requireAuth, ticketsRouter);
app.use("/api/customers", requireAuth, customersRouter);
app.use("/api/agents", requireAuth, agentsRouter);

app.get("/", (req, res) => {
  res.send("SupportFlow API is running.");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});