// lib/db.ts — Neon connection + schema. SERVER ONLY: never import from a "use client" file.
import { neon } from "@neondatabase/serverless"

let client: ReturnType<typeof neon> | null = null

export function sql() {
  if (!client) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error("DATABASE_URL is not set")
    client = neon(url)
  }
  return client
}

// Creates the table on first use, so there's nothing to run by hand in the Neon console.
let schemaReady: Promise<void> | null = null

export function ensureSchema(): Promise<void> {
  schemaReady ??= (async () => {
    const db = sql()
    await db`
      CREATE TABLE IF NOT EXISTS briefs (
        id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at    timestamptz NOT NULL DEFAULT now(),
        submitted_at  timestamptz NOT NULL DEFAULT now(),
        status        text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
        source        text NOT NULL DEFAULT 'form' CHECK (source IN ('form', 'import')),
        client_name   text NOT NULL,
        client_email  text,
        budget        text,
        meeting_type  text,
        gap_count     int  NOT NULL DEFAULT 0,
        form          jsonb NOT NULL,
        gaps          jsonb NOT NULL DEFAULT '[]'::jsonb,
        meeting       jsonb,
        quote         text,
        notes         text NOT NULL DEFAULT ''
      )`
    await db`CREATE TABLE IF NOT EXISTS voices (
      id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      submitted_at timestamptz NOT NULL DEFAULT now(),
      quote        text NOT NULL,
      words        jsonb NOT NULL DEFAULT '[]'::jsonb,
      name         text NOT NULL DEFAULT '',
      company      text NOT NULL DEFAULT '',
      role         text NOT NULL DEFAULT '',
      logo_url     text,
      status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))
    )`
    await db`ALTER TABLE voices ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT ''`
    await db`CREATE INDEX IF NOT EXISTS voices_status_submitted ON voices (status, submitted_at DESC)`
    await db`CREATE INDEX IF NOT EXISTS briefs_status_submitted ON briefs (status, submitted_at DESC)`
    // Trash support: a brief with deleted_at set is hidden everywhere except the Trash tab.
    await db`ALTER TABLE briefs ADD COLUMN IF NOT EXISTS deleted_at timestamptz`
  })().catch((err) => {
    schemaReady = null // retry on the next call
    throw err
  })
  return schemaReady
}
