import pg from "pg";
import bcrypt from "bcryptjs";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      subject TEXT NOT NULL,
      customer TEXT NOT NULL,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      "assignedTo" TEXT NOT NULL,
      "updatedAt" TEXT NOT NULL,
      notes TEXT DEFAULT ''
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT NOT NULL,
      "openTickets" INTEGER DEFAULT 0,
      "totalTickets" INTEGER DEFAULT 0,
      joined TEXT NOT NULL
    )
  `);

  // Migration: phone number, added once the public contact-form flow needed it
  await pool.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT ''`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'agent',
      "createdAt" TEXT NOT NULL,
      "passwordHash" TEXT
    )
  `);

  // Migration: email-verification fields (added after the agents table already existed)
  await pool.query(`ALTER TABLE agents ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN DEFAULT false`);
  await pool.query(`ALTER TABLE agents ADD COLUMN IF NOT EXISTS "verificationToken" TEXT`);
  await pool.query(`ALTER TABLE agents ADD COLUMN IF NOT EXISTS "verificationTokenExpires" TEXT`);

  // In-app notifications (bell icon in the topbar), separate from email
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      "agentId" TEXT NOT NULL,
      type TEXT NOT NULL,
      "ticketId" TEXT,
      message TEXT NOT NULL,
      urgent BOOLEAN DEFAULT false,
      read BOOLEAN DEFAULT false,
      "createdAt" TEXT NOT NULL
    )
  `);

  // Backfill a temporary password for any agent rows that somehow have none
  // (left over from an old import, or created directly in the DB).
  const TEMP_PASSWORD = "Welcome123!";
  const { rows: needsPassword } = await pool.query(
    `SELECT id, email FROM agents WHERE "passwordHash" IS NULL`
  );
  if (needsPassword.length > 0) {
    const tempHash = bcrypt.hashSync(TEMP_PASSWORD, 10);
    for (const agent of needsPassword) {
      await pool.query(`UPDATE agents SET "passwordHash" = $1 WHERE id = $2`, [
        tempHash,
        agent.id,
      ]);
    }
    console.log(
      `[auth] Set temporary password "${TEMP_PASSWORD}" for ${needsPassword.length} existing agent(s). Log in with this and change it once a real "change password" flow exists.`
    );
  }
}

export default pool;