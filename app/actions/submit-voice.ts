"use server"

import { Resend } from "resend"
import { ensureSchema, sql } from "@/lib/db"

const TO_EMAIL = "njengaproductions@gmail.com"

export async function submitVoice(input: {
  quote: string
  words: string[]
  name: string
  company: string
}) {
  const quote = input.quote.trim()
  if (!quote) return { ok: false as const, error: "Please share your experience before submitting." }

  const words = input.words.filter(Boolean).slice(0, 12)
  const name = input.name.trim().slice(0, 120)
  const company = input.company.trim().slice(0, 160)
  await ensureSchema()
  const voiceId = crypto.randomUUID()
  await sql()`
    INSERT INTO voices (id, quote, words, name, company)
    VALUES (${voiceId}, ${quote}, ${JSON.stringify(words)}::jsonb, ${name}, ${company})
  `

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { ok: false as const, error: "Email service is not configured." }

  const esc = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char)
  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send(
    {
      from: "NJENGA Voices <onboarding@resend.dev>",
      to: [TO_EMAIL],
      subject: "New Voice Submission — Pending Review",
      html: `<div style="font-family:Arial,sans-serif;max-width:640px"><p style="color:#b5520a;font-weight:bold;letter-spacing:.12em">NEW VOICE SUBMISSION</p><blockquote style="font-family:Georgia,serif;font-style:italic;border-left:3px solid #b5520a;padding-left:16px">${esc(quote)}</blockquote><p><strong>Name:</strong> ${esc(name || "Not provided")}<br/><strong>Company:</strong> ${esc(company || "Not provided")}<br/><strong>Words:</strong> ${esc(words.join(", ") || "None selected")}</p><p style="color:#666">Status: Pending Review</p></div>`,
    },
    { idempotencyKey: `voice-submission/${crypto.randomUUID()}` },
  )

  if (error) return { ok: false as const, error: "We couldn't send your voice right now. Please try again." }
  return { ok: true as const }
}

export type SubmitVoiceResult = Awaited<ReturnType<typeof submitVoice>>
