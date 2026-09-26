"use server"

// app/actions/suggest-tier.ts
// The AI only CLASSIFIES the described project into one of the existing tiers.
// It never invents a price — every number the client sees comes from BUDGET_TIERS / TIER_RANGE.

import { generateText, Output } from "ai"
import { z } from "zod"
import { BUDGET_TIERS, type BriefForm } from "@/components/brief/data"

export type TierInput = Pick<
  BriefForm,
  | "serviceType"
  | "projectType"
  | "projectDesc"
  | "subjects"
  | "location"
  | "indoorOutdoor"
  | "voiceover"
  | "turnaround"
  | "projectDate"
>

const TIER_NAMES = BUDGET_TIERS.map((t) => t.name) as [string, ...string[]]

const SuggestionSchema = z.object({
  tier: z.enum(TIER_NAMES).describe("The single tier the described project most likely falls under."),
  confident: z
    .boolean()
    .describe("false if the description is too vague or contradictory to place the project in a tier."),
  reason: z
    .string()
    .describe(
      "One short sentence to the client, second person, under 25 words, explaining the fit. Never mention prices.",
    ),
})

export type TierSuggestion = z.infer<typeof SuggestionSchema>

const clip = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : "")

export async function suggestTier(
  input: TierInput,
): Promise<{ ok: true; data: TierSuggestion } | { ok: false }> {
  const desc = clip(input.projectDesc, 2000).trim()
  if (desc.length < 15) return { ok: false } // too thin to judge

  const rateCard = BUDGET_TIERS.map((t) => `- ${t.name} (${t.range}): ${t.desc}`).join("\n")
  const details = [
    `Service needed: ${clip(input.serviceType, 80) || "—"}`,
    `Project type: ${Array.isArray(input.projectType) ? input.projectType.slice(0, 6).join(", ") : "—"}`,
    `Date: ${clip(input.projectDate, 60) || "—"}`,
    `Location: ${clip(input.location, 120) || "—"}`,
    `Indoor/outdoor: ${clip(input.indoorOutdoor, 40) || "—"}`,
    `Subjects/people: ${clip(input.subjects, 80) || "—"}`,
    `Script/voiceover: ${clip(input.voiceover, 20) || "—"}`,
    `Turnaround: ${clip(input.turnaround, 60) || "—"}`,
    `Description: ${desc}`,
  ].join("\n")

  try {
    const { output } = await generateText({
      model: "google/gemini-2.5-flash",
      output: Output.object({ schema: SuggestionSchema }),
      messages: [
        {
          role: "user",
          content:
            "You help a video production company place a client's project into one of its package tiers.\n\n" +
            `Tiers:\n${rateCard}\n\n` +
            "Rules:\n" +
            "- Choose 'Edit Only' only if the client needs editing of existing footage and no filming.\n" +
            "- Choose 'Shoot Only' only if the client needs filming with no editing.\n" +
            "- Choose 'Wedding' only for weddings.\n" +
            "- Choose 'Premium' only for multi-day shoots or clearly large-scope work.\n" +
            "- Otherwise choose the lowest tier that plausibly covers the described scope.\n" +
            "- Set confident=false if the description is too vague to judge.\n\n" +
            `Client details:\n${details}`,
        },
      ],
    })
    return { ok: true, data: output }
  } catch (err) {
    console.log("[v0] suggestTier error:", err instanceof Error ? err.message : String(err))
    return { ok: false }
  }
}
