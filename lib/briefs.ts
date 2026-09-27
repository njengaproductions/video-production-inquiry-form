// lib/briefs.ts — reading and writing briefs. SERVER ONLY.
import { isAdmin } from "@/auth"
import { ensureSchema, sql } from "@/lib/db"
import type { BriefForm } from "@/components/brief/data"
import type { Gap, MeetingPlan } from "@/components/brief/gaps"

export const STATUSES = ["active", "closed", "archived"] as const
export type BriefStatus = (typeof STATUSES)[number]

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
}

async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("Unauthorized")
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
    const budget = f.budgetTier
      ? `${f.budgetTier}${f.tierTentative ? " (tentative)" : ""}`
      : f.customBudget || null
    await sql()`
      INSERT INTO briefs (client_name, client_email, budget, meeting_type, gap_count, form, gaps, meeting, quote)
      VALUES (
        ${f.fullName.trim()},
        ${f.email.trim() || null},
        ${budget},
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
    SELECT id, submitted_at, status, source, client_name, client_email, budget, meeting_type, gap_count
    FROM briefs
    WHERE status = ${status}
    ORDER BY submitted_at DESC
    LIMIT 200`
  return rows as unknown as BriefRow[]
}

export async function countBriefs(): Promise<Record<BriefStatus, number>> {
  await requireAdmin()
  await ensureSchema()
  const rows = (await sql()`SELECT status, count(*)::int AS n FROM briefs GROUP BY status`) as unknown as {
    status: BriefStatus
    n: number
  }[]
  const out: Record<BriefStatus, number> = { active: 0, closed: 0, archived: 0 }
  for (const r of rows) out[r.status] = r.n
  return out
}
