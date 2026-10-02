"use server"

import { put } from "@vercel/blob"
import { revalidatePath } from "next/cache"
import { isAdmin } from "@/auth"
import { updateVoiceLogo, updateVoiceStatus } from "@/lib/voices"

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
