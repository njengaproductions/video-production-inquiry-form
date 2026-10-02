import { isAdmin } from "@/auth"
import { ensureSchema, sql } from "@/lib/db"

export type VoiceStatus = "pending" | "approved" | "rejected"

export type Voice = {
  id: string
  submitted_at: string
  quote: string
  words: string[]
  name: string
  company: string
  logo_url: string | null
  status: VoiceStatus
}

function mapVoice(row: Record<string, unknown>): Voice {
  return {
    id: String(row.id),
    submitted_at: String(row.submitted_at),
    quote: String(row.quote),
    words: Array.isArray(row.words) ? row.words.filter((word): word is string => typeof word === "string") : [],
    name: String(row.name ?? ""),
    company: String(row.company ?? ""),
    logo_url: typeof row.logo_url === "string" ? row.logo_url : null,
    status: row.status as VoiceStatus,
  }
}

export async function listApprovedVoices() {
  await ensureSchema()
  const rows = (await sql()`SELECT id, submitted_at, quote, words, name, company, logo_url, status FROM voices WHERE status = 'approved' ORDER BY submitted_at DESC`) as Record<string, unknown>[]
  return rows.map(mapVoice)
}

export async function listPendingVoices() {
  if (!(await isAdmin())) throw new Error("Unauthorized")
  await ensureSchema()
  const rows = (await sql()`SELECT id, submitted_at, quote, words, name, company, logo_url, status FROM voices WHERE status = 'pending' ORDER BY submitted_at DESC`) as Record<string, unknown>[]
  return rows.map(mapVoice)
}

export async function updateVoiceStatus(id: string, status: Exclude<VoiceStatus, "pending">) {
  if (!(await isAdmin())) throw new Error("Unauthorized")
  await ensureSchema()
  await sql()`UPDATE voices SET status = ${status} WHERE id = ${id}::uuid`
}

export async function updateVoiceLogo(id: string, logoUrl: string) {
  if (!(await isAdmin())) throw new Error("Unauthorized")
  await ensureSchema()
  await sql()`UPDATE voices SET logo_url = ${logoUrl} WHERE id = ${id}::uuid`
}

export async function getVoice(id: string) {
  if (!(await isAdmin())) throw new Error("Unauthorized")
  await ensureSchema()
  const rows = (await sql()`SELECT id, submitted_at, quote, words, name, company, logo_url, status FROM voices WHERE id = ${id}::uuid LIMIT 1`) as Record<string, unknown>[]
  return rows[0] ? mapVoice(rows[0]) : null
}
