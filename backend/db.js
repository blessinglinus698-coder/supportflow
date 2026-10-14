import Database from "better-sqlite3";

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
const columns = db.prepare("PRAGMA table_info(tickets)").all();
const hasNotes = columns.some((col) => col.name === "notes");
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

export default db;


db.exec(`
  CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'agent',
    createdAt TEXT NOT NULL
  )
`);