"use server"

// app/admin/actions.ts — every action re-checks admin access on the server.
import { revalidatePath } from "next/cache"
import { isAdmin } from "@/auth"
import { sql } from "@/lib/db"
import { findByEmail, getBrief, insertImported, purgeBrief, restoreBrief, setNotes, setStatus, trashBrief } from "@/lib/briefs"
import { isStatus } from "@/lib/brief-status"
import { parseBriefEmail, pickForm } from "@/lib/brief-rows"
import { extractBrief } from "@/app/actions/extract-brief"
import { normalizeForm, planMeeting, structuralGaps } from "@/components/brief/gaps"
import type { BriefForm } from "@/components/brief/data"

type Result = { ok: true } | { ok: false; error: string }

async function guard(): Promise<{ ok: false; error: string } | null> {
  return (await isAdmin()) ? null : { ok: false, error: "Not authorized. Please sign in again." }
}

export async function changeStatus(id: string, status: string): Promise<Result> {
  const denied = await guard()
  if (denied) return denied
  if (!isStatus(status)) return { ok: false, error: "Unknown status." }
  try {
    await setStatus(id, status)
    revalidatePath("/admin")
    revalidatePath(`/admin/briefs/${id}`)
    return { ok: true }
  } catch {
    return { ok: false, error: "Couldn't update the status. Try again." }
  }
}

export async function saveNotes(id: string, notes: string): Promise<Result> {
  const denied = await guard()
  if (denied) return denied
  try {
    await setNotes(id, String(notes ?? ""))
    return { ok: true }
  } catch {
    return { ok: false, error: "Couldn't save notes. Try again." }
  }
}

// Typed-name check, repeated on the server so the safeguard can't be skipped.
const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

export async function moveToTrash(id: string, typedName: string): Promise<Result> {
  const denied = await guard()
  if (denied) return denied
  const b = await getBrief(id)
  if (!b) return { ok: false, error: "Brief not found." }
  if (!sameName(typedName, b.client_name)) return { ok: false, error: "The name doesn't match." }
  try {
    await trashBrief(id)
    revalidatePath("/admin")
    return { ok: true }
  } catch {
    return { ok: false, error: "Couldn't move it to Trash. Try again." }
  }
}

export async function restoreFromTrash(id: string): Promise<Result> {
  const denied = await guard()
  if (denied) return denied
  try {
    await restoreBrief(id)
    revalidatePath("/admin")
    revalidatePath(`/admin/briefs/${id}`)
    return { ok: true }
  } catch {
    return { ok: false, error: "Couldn't restore it. Try again." }
  }
}

export async function deleteForever(id: string, typedName: string): Promise<Result> {
  const denied = await guard()
  if (denied) return denied
  const b = await getBrief(id)
  if (!b) return { ok: false, error: "Brief not found." }
  if (!b.deleted_at) return { ok: false, error: "Move it to Trash first." }
  if (!sameName(typedName, b.client_name)) return { ok: false, error: "The name doesn't match." }
  try {
    const gone = await purgeBrief(id)
    revalidatePath("/admin")
    return gone ? { ok: true } : { ok: false, error: "Couldn't delete it. Try again." }
  } catch {
    return { ok: false, error: "Couldn't delete it. Try again." }
  }
}

export type ParsedImport =
  | { ok: true; form: BriefForm; found: number; usedAI: boolean; duplicateOn: string | null }
  | { ok: false; error: string }

export async function parseImport(text: string): Promise<ParsedImport> {
  const denied = await guard()
  if (denied) return denied
  const body = String(text ?? "").slice(0, 50000)
  if (body.trim().length < 20) return { ok: false, error: "Paste the full email text first." }

  let { form, found } = parseBriefEmail(body)
  let usedAI = false

  // Unfamiliar format (older or reformatted email): let the AI extractor read it instead.
  if (found < 3) {
    const fd = new FormData()
    fd.append("file", new File([body], "email.txt", { type: "text/plain" }))
    const r = await extractBrief(fd)
    if (r.ok) {
      usedAI = true
      const d = r.data
      form = pickForm({
        ...d,
        projectType: [...(d.projectType ?? [])],
        tone: [...(d.tone ?? [])],
      })
      found = Object.values(d).filter((v) => (Array.isArray(v) ? v.length : typeof v === "string" && v.trim())).length
    }
  }

  if (!form.fullName.trim()) return { ok: false, error: "Couldn't find a client name in that email." }
  const dup = await findByEmail(form.email)
  return { ok: true, form, found, usedAI, duplicateOn: dup?.submitted_at ?? null }
}

export async function importBrief(rawForm: unknown, date: string): Promise<Result> {
  const denied = await guard()
  if (denied) return denied
  const form = normalizeForm(pickForm(rawForm))
  if (!form.fullName.trim()) return { ok: false, error: "A client name is required." }
  const day = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : new Date().toISOString().slice(0, 10)
  const gaps = structuralGaps(form)
  try {
    await insertImported({
      form,
      gaps,
      meeting: planMeeting(gaps),
      submittedAt: `${day}T12:00:00-05:00`,
    })
    revalidatePath("/admin")
    return { ok: true }
  } catch {
    return { ok: false, error: "Couldn't import that brief. Try again." }
  }
}

async function stageCount(briefId: string): Promise<number> {
  const rows = (await sql()`SELECT jsonb_array_length(COALESCE(tracker_stages, '[]'::jsonb)) AS len FROM briefs WHERE id = ${briefId}`) as { len: number | string }[]
  return Number(rows[0]?.len ?? 0)
}

export async function toggleTrackerStage(briefId: string, index: number, done: boolean) {
  if (!(await isAdmin())) return
  if (!Number.isInteger(index) || index < 0) return
  if (index >= (await stageCount(briefId))) return
  await sql()`
    UPDATE briefs
    SET tracker_stages = jsonb_set(tracker_stages, ${`{${index},done}`}::text[], ${done ? "true" : "false"}::jsonb)
    WHERE id = ${briefId}
  `
  revalidatePath(`/admin/briefs/${briefId}`)
}

export async function setStageDate(briefId: string, index: number, date: string | null) {
  if (!(await isAdmin())) return
  if (!Number.isInteger(index) || index < 0) return
  if (date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return
  if (index >= (await stageCount(briefId))) return
  await sql()`
    UPDATE briefs
    SET tracker_stages = jsonb_set(tracker_stages, ${`{${index},date}`}::text[], ${JSON.stringify(date)}::jsonb)
    WHERE id = ${briefId}
  `
  revalidatePath(`/admin/briefs/${briefId}`)
}

export async function setStageNote(briefId: string, index: number, note: string, noteVisible: boolean) {
  if (!(await isAdmin())) return
  if (!Number.isInteger(index) || index < 0) return
  if (index >= (await stageCount(briefId))) return
  const trimmed = note.trim().slice(0, 280)
  await sql()`
    UPDATE briefs
    SET tracker_stages = jsonb_set(
      jsonb_set(tracker_stages, ${`{${index},note}`}::text[], ${JSON.stringify(trimmed)}::jsonb),
      ${`{${index},noteVisible}`}::text[], ${noteVisible ? "true" : "false"}::jsonb
    )
    WHERE id = ${briefId}
  `
  revalidatePath(`/admin/briefs/${briefId}`)
}

export async function shareTrackerWithClient(briefId: string): Promise<Result> {
  const denied = await guard()
  if (denied) return denied
  const b = await getBrief(briefId)
  if (!b) return { ok: false, error: "Brief not found." }
  if (!b.tracker_id) return { ok: false, error: "No tracker ID assigned yet." }
  const email = b.client_email ?? (b.form as { email?: string } | null)?.email ?? null
  if (!email) return { ok: false, error: "No client email on file." }
  const { sendTrackerEmail } = await import("@/app/actions/send-tracker-email")
  const result = await sendTrackerEmail(email, b.client_name, b.tracker_id)
  if (!result.ok) return { ok: false, error: "Email failed. Check Resend logs." }
  revalidatePath(`/admin/briefs/${briefId}`)
  return { ok: true }
}
