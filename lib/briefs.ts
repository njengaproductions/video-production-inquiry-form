// lib/briefs.ts — reading and writing briefs. SERVER ONLY.
import { isAdmin } from "@/auth"
import { ensureSchema, sql } from "@/lib/db"
import { isStatus, type BriefStatus } from "@/lib/brief-status"
import type { BriefForm } from "@/components/brief/data"
import type { Gap, MeetingPlan } from "@/components/brief/gaps"

export { STATUSES, type BriefStatus } from "@/lib/brief-status"

export type TrackerStage = {
  key: string
  label: string
  done: boolean
  date?: string
}

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
  tracker_id?: string | null
  tracker_stages?: TrackerStage[] | null
  tracker_access_count?: number
  tracker_last_viewed?: string | null
}

export type BriefDetail = BriefRow & {
  form: BriefForm
  gaps: Gap[]
  meeting: MeetingPlan | null
  quote: string | null
  notes: string
  tracker_id: string | null
  tracker_stages: TrackerStage[] | null
  tracker_access_count: number
  tracker_last_viewed: string | null
}

export type PublicTracker = {
  name: string
  budget_tier: string | null
  tracker_id: string
  tracker_stages: TrackerStage[]
}

function mapToTrackerTier(budgetTier: string): string {
  if (budgetTier === "Edit Only") return "edit-only"
  if (budgetTier === "Shoot Only") return "shoot-only"
  if (budgetTier === "Wedding") return "wedding"
  return "full-production"
}

const TRACKER_STAGES: Record<string, TrackerStage[]> = {
  "edit-only": [
    { key: "brief-received", label: "Brief received", done: false },
    { key: "contract-signed", label: "Contract signed", done: false },
    { key: "footage-received", label: "Footage received", done: false },
    { key: "editing", label: "Editing in progress", done: false },
    { key: "review", label: "Client review", done: false },
    { key: "delivery", label: "Final delivery", done: false },
  ],
  "shoot-only": [
    { key: "brief-received", label: "Brief received", done: false },
    { key: "contract-signed", label: "Contract signed", done: false },
    { key: "pre-production", label: "Pre-production planning", done: false },
    { key: "shoot", label: "Shoot day", done: false },
    { key: "delivery", label: "Raw footage delivery", done: false },
  ],
  "full-production": [
    { key: "brief-received", label: "Brief received", done: false },
    { key: "contract-signed", label: "Contract signed", done: false },
    { key: "pre-production", label: "Pre-production planning", done: false },
    { key: "shoot", label: "Shoot day", done: false },
    { key: "editing", label: "Editing & post-production", done: false },
    { key: "review", label: "Client review", done: false },
    { key: "delivery", label: "Final delivery", done: false },
  ],
  wedding: [
    { key: "consultation", label: "Initial consultation", done: false },
    { key: "contract-signed", label: "Contract signed", done: false },
    { key: "pre-production", label: "Pre-production planning", done: false },
    { key: "shoot", label: "Shoot day", done: false },
    { key: "editing", label: "Editing & post", done: false },
    { key: "review", label: "Client review", done: false },
    { key: "delivery", label: "Final delivery", done: false },
  ],
}

function defaultStages(budgetTier: string): TrackerStage[] {
  const tier = mapToTrackerTier(budgetTier)
  return TRACKER_STAGES[tier] ?? TRACKER_STAGES["full-production"]
}

async function generateTrackerId(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const id = String(Math.floor(100000 + Math.random() * 900000))
    const existing = (await sql()`SELECT 1 FROM briefs WHERE tracker_id = ${id}`) as unknown[]
    if (existing.length === 0) return id
  }
  throw new Error("Could not generate unique tracker ID after 10 attempts")
}

// One-off: gives every existing brief without a tracker an ID and its tier's default stages.
export async function backfillTrackers(): Promise<number> {
  await requireAdmin()
  await ensureSchema()
  const rows = (await sql()`
    SELECT id, form->>'budgetTier' AS budget_tier FROM briefs WHERE tracker_id IS NULL`) as unknown as {
    id: string
    budget_tier: string | null
  }[]
  for (const row of rows) {
    const trackerId = await generateTrackerId()
    const stages = defaultStages(row.budget_tier ?? "")
    await sql()`
      UPDATE briefs
      SET tracker_id = ${trackerId}, tracker_stages = ${JSON.stringify(stages)}::jsonb
      WHERE id = ${row.id} AND tracker_id IS NULL`
  }
  return rows.length
}

const TRACKER_CODE = /^\d{6}$/

// Public, no auth: the 6-digit code is the only key. Returns no contact details.
export async function getByTrackerId(code: string): Promise<PublicTracker | null> {
  if (!TRACKER_CODE.test(code)) return null
  await ensureSchema()
  const rows = (await sql()`
    UPDATE briefs
    SET tracker_access_count = COALESCE(tracker_access_count, 0) + 1,
        tracker_last_viewed = NOW()
    WHERE tracker_id = ${code} AND deleted_at IS NULL
    RETURNING client_name AS name, form->>'budgetTier' AS budget_tier, tracker_id, tracker_stages`) as unknown as PublicTracker[]
  const row = rows[0]
  if (!row) return null
  return { ...row, budget_tier: row.budget_tier || null, tracker_stages: Array.isArray(row.tracker_stages) ? row.tracker_stages : [] }
}

export async function setTrackerStages(id: string, stages: TrackerStage[]): Promise<void> {
  await requireAdmin()
  if (!UUID.test(id)) throw new Error("Invalid request")
  await sql()`UPDATE briefs SET tracker_stages = ${JSON.stringify(stages)}::jsonb WHERE id = ${id}`
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
    const trackerId = await generateTrackerId()
    const stages = defaultStages(f.budgetTier ?? "")
    await sql()`
      INSERT INTO briefs (client_name, client_email, budget, meeting_type, gap_count, form, gaps, meeting, quote, tracker_id, tracker_stages)
      VALUES (
        ${f.fullName.trim()},
        ${f.email.trim() || null},
        ${budgetLabelOf(f)},
        ${input.meeting.type},
        ${input.gaps.length},
        ${JSON.stringify(f)}::jsonb,
        ${JSON.stringify(input.gaps)}::jsonb,
        ${JSON.stringify(input.meeting)}::jsonb,
        ${input.quote},
        ${trackerId},
        ${JSON.stringify(stages)}::jsonb
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
           form, gaps, meeting, quote, notes,
           tracker_id, tracker_stages, tracker_access_count, tracker_last_viewed
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
