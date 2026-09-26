// components/brief/budget.ts
// Smart budget minimums for clients who don't pick a tier.
// The minimum and suggested range follow the service type (and Wedding for full productions).

import type { BriefForm } from "./data"

export type BudgetRule = {
  min: number // hard floor for "From"
  suggest: [number, number] // placeholder range
  label: string // used in messages, e.g. "Projects like yours start at $1,000"
}

// Starting price and typical range for every tier. The single source for minimums.
export const TIER_RANGE: Record<string, [number, number]> = {
  "Edit Only": [200, 600],
  "Shoot Only": [600, 1000],
  Essential: [550, 1000],
  Growth: [1000, 2500],
  Wedding: [2500, 5000],
  Premium: [5000, 10000],
}

// Minimum for the custom-budget path.
// 1st choice: the tier the AI matched to what the client described.
// Fallback (AI unavailable or unsure): the service-type rule.
export function budgetRule(f: Pick<BriefForm, "serviceType" | "projectType" | "suggestedTier">): BudgetRule {
  const matched = TIER_RANGE[f.suggestedTier]
  if (matched) return { min: matched[0], suggest: matched, label: "Projects like yours" }

  const s = f.serviceType
  if (s.startsWith("Edit Only")) return { min: 200, suggest: [200, 600], label: "Edit-only projects" }
  if (s.startsWith("Shoot Only")) return { min: 600, suggest: [600, 1000], label: "Shoot-only projects" }
  if (s.startsWith("Full Production")) {
    return f.projectType.includes("Wedding")
      ? { min: 2500, suggest: [2500, 5000], label: "Wedding productions" }
      : { min: 800, suggest: [1000, 2500], label: "Full productions" }
  }
  return { min: 550, suggest: [1000, 2500], label: "Projects" }
}

// Digits only, capped at 7 digits ($9,999,999).
export const onlyDigits = (v: string) => v.replace(/\D/g, "").replace(/^0+/, "").slice(0, 7)

export const fmtMoney = (digits: string | number) => {
  const n = typeof digits === "number" ? digits : Number(digits)
  return digits === "" || Number.isNaN(n) ? "" : n.toLocaleString("en-US")
}

// The single string the rest of the app (gaps, email, quote range) reads.
export function budgetLabel(min: string, max: string): string {
  if (!min) return ""
  return max ? `$${fmtMoney(min)} – $${fmtMoney(max)}` : `$${fmtMoney(min)}+`
}

// Parses AI-extracted text like "$1k-2k", "$1,500 – $3,000", "up to $750".
// Returns digit strings; empty strings if nothing usable.
export function parseBudgetRange(text: string): { min: string; max: string } {
  const nums = [...text.matchAll(/(\d[\d,]*(?:\.\d+)?)\s*(k)?/gi)]
    .map((m) => Math.round(parseFloat(m[1].replace(/,/g, "")) * (m[2] ? 1000 : 1)))
    .filter((n) => n > 0)
  if (!nums.length) return { min: "", max: "" }
  const [a, b] = nums
  if (b === undefined) return { min: String(a), max: "" }
  return { min: String(Math.min(a, b)), max: String(Math.max(a, b)) }
}

// Validation for the custom path. Returns messages to show under each field.
export function budgetErrors(f: BriefForm): { min?: string; max?: string } {
  const rule = budgetRule(f)
  const min = Number(f.budgetMin || 0)
  const max = Number(f.budgetMax || 0)
  const out: { min?: string; max?: string } = {}
  if (f.budgetMin && min < rule.min) out.min = `${rule.label} start at $${fmtMoney(rule.min)}.`
  if (f.budgetMax && max < min) out.max = "The top of your range can't be lower than the starting amount."
  return out
}

export function budgetValid(f: BriefForm): boolean {
  if (!f.budgetMin) return false
  const e = budgetErrors(f)
  return !e.min && !e.max
}
