import Database from "better-sqlite3";
import bcrypt from "bcryptjs";

const db = new Database("supportflow.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    subject TEXT NOT NULL,
    customer TEXT NOT NULL,
    status TEXT NOT NULL,
    priority TEXT NOT NULL,
    assignedTo TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )
`);

// Migration: add notes column if it doesn't exist yet
const ticketColumns = db.prepare("PRAGMA table_info(tickets)").all();
const hasNotes = ticketColumns.some((col) => col.name === "notes");
if (!hasNotes) {
  db.exec("ALTER TABLE tickets ADD COLUMN notes TEXT DEFAULT ''");
}

db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT NOT NULL,
    openTickets INTEGER DEFAULT 0,
    totalTickets INTEGER DEFAULT 0,
    joined TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'agent',
    createdAt TEXT NOT NULL
  )
`);

// Migration: add passwordHash column if it doesn't exist yet
const agentColumns = db.prepare("PRAGMA table_info(agents)").all();
const hasPasswordHash = agentColumns.some((col) => col.name === "passwordHash");
if (!hasPasswordHash) {
  db.exec("ALTER TABLE agents ADD COLUMN passwordHash TEXT");

  // Backfill a temporary password for any agents created before auth existed
  const TEMP_PASSWORD = "Welcome123!";
  const tempHash = bcrypt.hashSync(TEMP_PASSWORD, 10);
  const agentsNeedingPassword = db
    .prepare("SELECT id, email FROM agents WHERE passwordHash IS NULL")
    .all();
  if (agentsNeedingPassword.length > 0) {
    const setPassword = db.prepare("UPDATE agents SET passwordHash = ? WHERE id = ?");
    for (const agent of agentsNeedingPassword) {
      setPassword.run(tempHash, agent.id);
    }
    console.log(
      `[auth] Set temporary password "${TEMP_PASSWORD}" for ${agentsNeedingPassword.length} existing agent(s). Log in with this and change it once a real "change password" flow exists.`
    );
  }
}

export default db;