"use server"

// app/admin/actions.ts — every action re-checks admin access on the server.
import { revalidatePath } from "next/cache"
import { isAdmin } from "@/auth"
import { findByEmail, insertImported, setNotes, setStatus } from "@/lib/briefs"
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
