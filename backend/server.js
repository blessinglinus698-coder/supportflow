import "dotenv/config";
import express from "express";
import cors from "cors";
import ticketsRouter from "./routes/tickets.js";
import customersRouter from "./routes/customers.js";
import agentsRouter from "./routes/agents.js";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.use("/api/tickets", ticketsRouter);
app.use("/api/customers", customersRouter);
app.use("/api/agents", agentsRouter);

app.get("/", (req, res) => {
  res.send("SupportFlow API is running.");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});