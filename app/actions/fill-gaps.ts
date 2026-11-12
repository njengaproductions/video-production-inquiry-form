"use server"

import { generateText, Output } from "ai"
import { z } from "zod"
import type { BriefForm } from "@/components/brief/data"

const FILLABLE_FIELDS = [
  "projectDesc",
  "subjects",
  "location",
  "tone",
  "references",
  "notes",
  "voiceover",
  "turnaround",
] as const

const FillSchema = z.object({
  suggestions: z
    .array(
      z.object({
        field: z.enum(FILLABLE_FIELDS),
        suggestion: z.string().min(1).max(240),
        confidence: z.enum(["high", "medium"]),
        reasoning: z.string().min(1).max(120),
      }),
    )
    .max(4),
  overallReadiness: z.enum(["strong", "moderate", "thin"]),
})

export type GapFillResult = z.infer<typeof FillSchema>

function clip(value: unknown, limit: number) {
  return typeof value === "string" ? value.slice(0, limit).trim() : ""
}

function clipList(value: unknown, itemLimit: number, itemLength: number) {
  return Array.isArray(value)
    ? value.slice(0, itemLimit).map((item) => clip(item, itemLength)).filter(Boolean).join(", ")
    : ""
}

function summarizeForm(form: Partial<BriefForm>) {
  return [
    `Service: ${clip(form.serviceType, 100) || "—"}`,
    `Project type: ${clipList(form.projectType, 6, 100) || "—"}`,
    `Date: ${clip(form.projectDate, 60) || "—"}`,
    `Location: ${clip(form.location, 240) || "—"}`,
    `Budget tier: ${clip(form.budgetTier, 100) || clip(form.customBudget, 100) || "—"}`,
    `Subjects/people: ${clip(form.subjects, 240) || "—"}`,
    `Voiceover: ${clip(form.voiceover, 100) || "—"}`,
    `Turnaround: ${clip(form.turnaround, 160) || "—"}`,
    `Tone: ${clipList(form.tone, 8, 100) || "—"}`,
    `Description: ${clip(form.projectDesc, 1600) || "—"}`,
    `References: ${clip(form.references, 500) || "—"}`,
    `Notes: ${clip(form.notes, 500) || "—"}`,
  ].join("\n")
}

export async function fillGaps(
  partial: Partial<BriefForm>,
): Promise<{ ok: true; data: GapFillResult } | { ok: false }> {
  if (!partial || typeof partial !== "object") return { ok: false }

  const description = clip(partial.projectDesc, 1600)
  if (description.length < 40) return { ok: false }

  try {
    const { output } = await generateText({
      model: "google/gemini-3.8-flash",
      output: Output.object({ schema: FillSchema }),
      messages: [
        {
          role: "user",
          content:
            "You are a video production consultant reviewing a client's project brief. Identify 1–4 fields that are genuinely weak, vague, or missing and would help a producer quote or plan the project.\n\n" +
            "Only suggest these fields: projectDesc, subjects, location, tone, references, notes, voiceover, turnaround. Do not flag clear or inapplicable fields (for example, do not ask about location for edit-only work). Suggestions should be friendly, specific, actionable, and phrased for the client. The short reasoning is producer-facing. Do not invent facts or assume details not in the brief.\n\n" +
            `Client brief:\n${summarizeForm(partial)}`,
        },
      ],
    })

    return { ok: true, data: output }
  } catch (error) {
    console.error("[ai] fillGaps failed:", error instanceof Error ? error.message : String(error))
    return { ok: false }
  }
}
