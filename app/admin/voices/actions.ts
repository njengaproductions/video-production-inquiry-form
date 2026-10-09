"use server"

import { del, put } from "@vercel/blob"
import { revalidatePath } from "next/cache"
import { isAdmin } from "@/auth"
import { normalizeLogoDisplay } from "@/lib/logo-display"
import { updateVoiceLogo, updateVoiceLogoDisplayRecord, updateVoiceNote, updateVoiceQuote, updateVoiceStatus } from "@/lib/voices"

type Result = { ok: true; url?: string } | { ok: false; error: string }

export async function setVoiceStatus(id: string, status: "approved" | "rejected"): Promise<Result> {
  if (!(await isAdmin())) return { ok: false, error: "Not authorized." }
  try {
    await updateVoiceStatus(id, status)
    revalidatePath("/admin/voices")
    revalidatePath("/voices")
    return { ok: true }
  } catch {
    return { ok: false, error: "Could not update this voice." }
  }
}

export async function deleteVoiceLogo(id: string, url: string): Promise<Result> {
  if (!(await isAdmin())) return { ok: false, error: "Not authorized." }
  try {
    await del(url)
    await updateVoiceLogo(id, null)
    revalidatePath("/admin/voices")
    revalidatePath("/voices")
    return { ok: true }
  } catch {
    return { ok: false, error: "Could not remove this logo." }
  }
}

export async function updateVoiceLogoDisplay(id: string, display: { fit: string; scale: number; position: { x: number; y: number } }): Promise<Result> {
  if (!(await isAdmin())) return { ok: false, error: "Not authorized." }
  try {
    await updateVoiceLogoDisplayRecord(id, normalizeLogoDisplay(display))
    revalidatePath("/admin/voices")
    revalidatePath("/voices")
    return { ok: true }
  } catch {
    return { ok: false, error: "Could not save logo adjustments." }
  }
}

export async function saveVoiceQuote(id: string, quote: string): Promise<Result> {
  if (!(await isAdmin())) return { ok: false, error: "Not authorized." }
  if (!quote.trim()) return { ok: false, error: "Quote cannot be empty." }
  try { await updateVoiceQuote(id, quote.trim()); revalidatePath("/admin/voices"); revalidatePath("/voices"); return { ok: true } } catch { return { ok: false, error: "Could not save this quote." } }
}

export async function saveVoiceNote(id: string, note: string): Promise<Result> {
  if (!(await isAdmin())) return { ok: false, error: "Not authorized." }
  try { await updateVoiceNote(id, note); revalidatePath("/admin/voices"); return { ok: true } } catch { return { ok: false, error: "Could not save this note." } }
}

export async function uploadVoiceLogo(id: string, file: File): Promise<Result> {
  if (!(await isAdmin())) return { ok: false, error: "Not authorized." }
  if (!file.type.startsWith("image/")) return { ok: false, error: "Please choose an image file." }
  if (file.size > 5 * 1024 * 1024) return { ok: false, error: "Logo must be smaller than 5MB." }

  try {
    const blob = await put(`voice-logos/${id}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`, file, { access: "public", addRandomSuffix: true })
    await updateVoiceLogo(id, blob.url)
    revalidatePath("/admin/voices")
    revalidatePath("/voices")
    return { ok: true, url: blob.url }
  } catch {
    return { ok: false, error: "Could not upload this logo." }
  }
}
