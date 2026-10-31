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

  // Migration: where a ticket came from (the built-in /contact page, or a
  // named external source submitting through its API key)
  await pool.query(`ALTER TABLE tickets ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'SupportFlow Contact Page'`);

  // Migration: "updatedAt" gets overwritten on every edit, so it can't be
  // used to answer "when was this created" or "when was this resolved"
  // once a ticket has been touched — Analytics needs both. "createdAt" is
  // set once, at creation, and never changes; "resolvedAt" is set once,
  // the moment a ticket's status first becomes "resolved".
  await pool.query(`ALTER TABLE tickets ADD COLUMN IF NOT EXISTS "createdAt" TEXT`);
  await pool.query(`ALTER TABLE tickets ADD COLUMN IF NOT EXISTS "resolvedAt" TEXT`);
  // Backfill for tickets that existed before this column did: "updatedAt"
  // is the best approximation available for their creation time.
  await pool.query(`UPDATE tickets SET "createdAt" = "updatedAt" WHERE "createdAt" IS NULL`);

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

  // Single-row table holding the public contact form's configuration
  await pool.query(`
    CREATE TABLE IF NOT EXISTS contact_form_settings (
      id TEXT PRIMARY KEY,
      enabled BOOLEAN DEFAULT true,
      title TEXT DEFAULT 'Contact Support',
      intro TEXT DEFAULT 'Tell us what''s going on and we''ll get back to you.',
      "phoneMode" TEXT DEFAULT 'optional'
    )
  `);
  // Migration: email requirement mode, added once admins needed to control it too
  await pool.query(`ALTER TABLE contact_form_settings ADD COLUMN IF NOT EXISTS "emailMode" TEXT DEFAULT 'required'`);

  await pool.query(
    `INSERT INTO contact_form_settings (id, enabled, title, intro, "phoneMode", "emailMode")
     VALUES ('default', true, 'Contact Support', 'Tell us what''s going on and we''ll get back to you.', 'optional', 'required')
     ON CONFLICT (id) DO NOTHING`
  );

  // External sources (other websites/forms) allowed to submit into the
  // public contact endpoint, each identified by its own API key
  await pool.query(`
    CREATE TABLE IF NOT EXISTS external_sources (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      "apiKey" TEXT UNIQUE NOT NULL,
      enabled BOOLEAN DEFAULT true,
      "createdAt" TEXT NOT NULL
    )
  `);

  // The Inbox's conversation thread for a ticket: the customer's original
  // message (seeded when a ticket comes in through the public contact form)
  // plus every agent reply sent from there. Kept separate from a ticket's
  // "notes" field, which stays internal-only and is never emailed.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ticket_messages (
      id TEXT PRIMARY KEY,
      "ticketId" TEXT NOT NULL,
      sender TEXT NOT NULL,
      "authorName" TEXT,
      body TEXT NOT NULL,
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