import { isAdmin } from "@/auth"
import { ensureSchema, sql } from "@/lib/db"
import { normalizeLogoDisplay, type LogoDisplay } from "@/lib/logo-display"

export type VoiceStatus = "pending" | "approved" | "rejected"

export type Voice = {
  id: string
  submitted_at: string
  quote: string
  words: string[]
  name: string
  company: string
  role: string
  internal_note: string
  logo_url: string | null
  logo_display: LogoDisplay
  status: VoiceStatus
}

function mapVoice(row: Record<string, unknown>): Voice {
  return {
    logo_display: normalizeLogoDisplay({ fit: row.logo_fit, scale: row.logo_scale, position: row.logo_position }),
    id: String(row.id),
    submitted_at: String(row.submitted_at),
    quote: String(row.quote),
    words: Array.isArray(row.words) ? row.words.filter((word): word is string => typeof word === "string") : [],
    name: String(row.name ?? ""),
    company: String(row.company ?? ""),
    role: String(row.role ?? ""),
    internal_note: String(row.internal_note ?? ""),
    logo_url: typeof row.logo_url === "string" ? row.logo_url : null,
    status: row.status as VoiceStatus,
  }
}

export async function listApprovedVoices() {
  await ensureSchema()
  const rows = (await sql()`SELECT id, submitted_at, quote, words, name, company, role, internal_note, logo_url, logo_fit, logo_scale, logo_position, status FROM voices WHERE status = 'approved' ORDER BY submitted_at DESC`) as Record<string, unknown>[]
  return rows.map(mapVoice)
}

export async function countPendingVoices() {
  if (!(await isAdmin())) throw new Error("Unauthorized")
  await ensureSchema()
  const rows = (await sql()`SELECT count(*)::int AS count FROM voices WHERE status = 'pending'`) as { count: number }[]
  return rows[0]?.count ?? 0
}

export async function listVoicesByStatus(status: "pending" | "approved") {
  if (!(await isAdmin())) throw new Error("Unauthorized")
  await ensureSchema()
  const rows = (await sql()`SELECT id, submitted_at, quote, words, name, company, role, internal_note, logo_url, logo_fit, logo_scale, logo_position, status FROM voices WHERE status = ${status} ORDER BY submitted_at DESC`) as Record<string, unknown>[]
  return rows.map(mapVoice)
}

export async function listPendingVoices() {
  if (!(await isAdmin())) throw new Error("Unauthorized")
  await ensureSchema()
  const rows = (await sql()`SELECT id, submitted_at, quote, words, name, company, role, internal_note, logo_url, logo_fit, logo_scale, logo_position, status FROM voices WHERE status = 'pending' ORDER BY submitted_at DESC`) as Record<string, unknown>[]
  return rows.map(mapVoice)
}

export async function updateVoiceStatus(id: string, status: Exclude<VoiceStatus, "pending">) {
  if (!(await isAdmin())) throw new Error("Unauthorized")
  await ensureSchema()
  await sql()`UPDATE voices SET status = ${status} WHERE id = ${id}::uuid`
}

export async function updateVoiceLogo(id: string, logoUrl: string | null) {
  if (!(await isAdmin())) throw new Error("Unauthorized")
  await ensureSchema()
  await sql()`UPDATE voices SET logo_url = ${logoUrl}, logo_fit = NULL, logo_scale = NULL, logo_position = NULL WHERE id = ${id}::uuid`
}

export async function updateVoiceLogoDisplayRecord(id: string, display: LogoDisplay) {
  if (!(await isAdmin())) throw new Error("Unauthorized")
  await ensureSchema()
  await sql()`UPDATE voices SET logo_fit = ${display.fit}, logo_scale = ${display.scale}, logo_position = ${JSON.stringify(display.position)} WHERE id = ${id}::uuid`
}

export async function updateVoiceQuote(id: string, quote: string) {
  if (!(await isAdmin())) throw new Error("Unauthorized")
  await ensureSchema()
  await sql()`UPDATE voices SET quote = ${quote.slice(0, 2000)} WHERE id = ${id}::uuid`
}

export async function updateVoiceNote(id: string, note: string) {
  if (!(await isAdmin())) throw new Error("Unauthorized")
  await ensureSchema()
  await sql()`UPDATE voices SET internal_note = ${note.slice(0, 1000)} WHERE id = ${id}::uuid`
}

export async function getVoice(id: string) {
  if (!(await isAdmin())) throw new Error("Unauthorized")
  await ensureSchema()
  const rows = (await sql()`SELECT id, submitted_at, quote, words, name, company, role, internal_note, logo_url, logo_fit, logo_scale, logo_position, status FROM voices WHERE id = ${id}::uuid LIMIT 1`) as Record<string, unknown>[]
  return rows[0] ? mapVoice(rows[0]) : null
}
