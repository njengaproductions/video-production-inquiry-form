// lib/briefs.ts — reading and writing briefs. SERVER ONLY.
import { isAdmin } from "@/auth"
import { ensureSchema, sql } from "@/lib/db"
import { isStatus, type BriefStatus } from "@/lib/brief-status"
import type { BriefForm } from "@/components/brief/data"
import type { Gap, MeetingPlan } from "@/components/brief/gaps"

export { STATUSES, type BriefStatus } from "@/lib/brief-status"

export type BriefRow = {
  id: string
  submitted_at: string
  status: BriefStatus
  source: "form" | "import"
  client_name: string
  client_email: string | null
  budget: string | null
  meeting_type: string | null
  gap_count: number
  deleted_at: string | null
}

export type BriefDetail = BriefRow & {
  form: BriefForm
  gaps: Gap[]
  meeting: MeetingPlan | null
  quote: string | null
  notes: string
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("Unauthorized")
}

function budgetLabelOf(f: BriefForm): string | null {
  if (f.budgetTier) return `${f.budgetTier}${f.tierTentative ? " (tentative)" : ""}`
  return f.customBudget || null
}

// Called by the public form. Never throws: if saving fails, the brief email still goes out.
export async function saveBrief(input: {
  form: BriefForm
  gaps: Gap[]
  meeting: MeetingPlan
  quote: string
}): Promise<boolean> {
  try {
    await ensureSchema()
    const f = input.form
    await sql()`
      INSERT INTO briefs (client_name, client_email, budget, meeting_type, gap_count, form, gaps, meeting, quote)
      VALUES (
        ${f.fullName.trim()},
        ${f.email.trim() || null},
        ${budgetLabelOf(f)},
        ${input.meeting.type},
        ${input.gaps.length},
        ${JSON.stringify(f)}::jsonb,
        ${JSON.stringify(input.gaps)}::jsonb,
        ${JSON.stringify(input.meeting)}::jsonb,
        ${input.quote}
      )`
    return true
  } catch (err) {
    console.log("[v0] saveBrief error:", err instanceof Error ? err.message : String(err))
    return false
  }
}

export async function listBriefs(status: BriefStatus): Promise<BriefRow[]> {
  await requireAdmin()
  await ensureSchema()
  const rows = await sql()`
    SELECT id, submitted_at, status, source, client_name, client_email, budget, meeting_type, gap_count, deleted_at
    FROM briefs
    WHERE status = ${status} AND deleted_at IS NULL
    ORDER BY submitted_at DESC
    LIMIT 200`
  return rows as unknown as BriefRow[]
}

export async function listTrash(): Promise<BriefRow[]> {
  await requireAdmin()
  await ensureSchema()
  const rows = await sql()`
    SELECT id, submitted_at, status, source, client_name, client_email, budget, meeting_type, gap_count, deleted_at
    FROM briefs
    WHERE deleted_at IS NOT NULL
    ORDER BY deleted_at DESC
    LIMIT 200`
  return rows as unknown as BriefRow[]
}

export async function trashBrief(id: string): Promise<void> {
  await requireAdmin()
  if (!UUID.test(id)) throw new Error("Invalid request")
  await sql()`UPDATE briefs SET deleted_at = now() WHERE id = ${id} AND deleted_at IS NULL`
}

export async function restoreBrief(id: string): Promise<void> {
  await requireAdmin()
  if (!UUID.test(id)) throw new Error("Invalid request")
  await sql()`UPDATE briefs SET deleted_at = NULL WHERE id = ${id}`
}

// Permanent. Only allowed for briefs already in Trash.
export async function purgeBrief(id: string): Promise<boolean> {
  await requireAdmin()
  if (!UUID.test(id)) throw new Error("Invalid request")
  const rows = (await sql()`
    DELETE FROM briefs WHERE id = ${id} AND deleted_at IS NOT NULL RETURNING id`) as unknown as { id: string }[]
  return rows.length === 1
}

export async function countBriefs(): Promise<Record<BriefStatus | "trash", number>> {
  await requireAdmin()
  await ensureSchema()
  const rows = (await sql()`
    SELECT CASE WHEN deleted_at IS NULL THEN status ELSE 'trash' END AS bucket, count(*)::int AS n
    FROM briefs GROUP BY bucket`) as unknown as { bucket: BriefStatus | "trash"; n: number }[]
  const out: Record<BriefStatus | "trash", number> = { active: 0, closed: 0, archived: 0, trash: 0 }
  for (const r of rows) out[r.bucket] = r.n
  return out
}

export async function getBrief(id: string): Promise<BriefDetail | null> {
  await requireAdmin()
  if (!UUID.test(id)) return null
  await ensureSchema()
  const rows = (await sql()`
    SELECT id, submitted_at, status, source, client_name, client_email, budget, meeting_type, gap_count, deleted_at,
           form, gaps, meeting, quote, notes
    FROM briefs WHERE id = ${id}`) as unknown as BriefDetail[]
  return rows[0] ?? null
}

export async function setStatus(id: string, status: BriefStatus): Promise<void> {
  await requireAdmin()
  if (!UUID.test(id) || !isStatus(status)) throw new Error("Invalid request")
  await sql()`UPDATE briefs SET status = ${status} WHERE id = ${id} AND deleted_at IS NULL`
}

export async function setNotes(id: string, notes: string): Promise<void> {
  await requireAdmin()
  if (!UUID.test(id)) throw new Error("Invalid request")
  await sql()`UPDATE briefs SET notes = ${notes.slice(0, 10000)} WHERE id = ${id}`
}

export async function findByEmail(email: string): Promise<{ id: string; submitted_at: string } | null> {
  await requireAdmin()
  if (!email.trim()) return null
  await ensureSchema()
  const rows = (await sql()`
    SELECT id, submitted_at FROM briefs
    WHERE lower(client_email) = lower(${email.trim()}) AND deleted_at IS NULL
    ORDER BY submitted_at DESC LIMIT 1`) as unknown as { id: string; submitted_at: string }[]
  return rows[0] ?? null
}

export async function insertImported(input: {
  form: BriefForm
  gaps: Gap[]
  meeting: MeetingPlan
  submittedAt: string // ISO
}): Promise<string> {
  await requireAdmin()
  await ensureSchema()
  const f = input.form
  const rows = (await sql()`
    INSERT INTO briefs (submitted_at, status, source, client_name, client_email, budget, meeting_type, gap_count, form, gaps, meeting)
    VALUES (
      ${input.submittedAt},
      'archived',
      'import',
      ${f.fullName.trim()},
      ${f.email.trim() || null},
      ${budgetLabelOf(f)},
      ${input.meeting.type},
      ${input.gaps.length},
      ${JSON.stringify(f)}::jsonb,
      ${JSON.stringify(input.gaps)}::jsonb,
      ${JSON.stringify(input.meeting)}::jsonb
    )
    RETURNING id`) as unknown as { id: string }[]
  return rows[0].id
}
