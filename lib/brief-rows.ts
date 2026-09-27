// lib/brief-rows.ts — the brief's fields grouped for display, and a parser for pasted brief emails.
// Labels match the brief email exactly, so pasted emails can be read back field by field.
import { BUDGET_TIERS, INITIAL_FORM, type BriefForm } from "@/components/brief/data"

type Key = keyof BriefForm

export const SECTIONS: { title: string; rows: { label: string; key: Key }[] }[] = [
  {
    title: "About the client",
    rows: [
      { label: "Full Name", key: "fullName" },
      { label: "Email", key: "email" },
      { label: "Phone", key: "phone" },
      { label: "Preferred Contact", key: "contactMethod" },
      { label: "Heard About Us", key: "heardFrom" },
      { label: "Referred By", key: "referral" },
      { label: "Decision Maker", key: "decisionMaker" },
      { label: "Final Approver", key: "approver" },
    ],
  },
  {
    title: "Project",
    rows: [
      { label: "Service Type", key: "serviceType" },
      { label: "Project Type", key: "projectType" },
      { label: "Project / Event Date", key: "projectDate" },
      { label: "Location", key: "location" },
      { label: "Indoor / Outdoor", key: "indoorOutdoor" },
      { label: "Subjects / People", key: "subjects" },
      { label: "Script / Voiceover", key: "voiceover" },
      { label: "Worked With Videographer Before", key: "priorVideographer" },
      { label: "Project Description", key: "projectDesc" },
    ],
  },
  {
    title: "Budget",
    rows: [
      { label: "Selected Tier", key: "budgetTier" },
      { label: "Add-Ons", key: "addOns" },
      { label: "Custom Budget", key: "customBudget" },
      { label: "Custom Description", key: "customDesc" },
      { label: "AI Likely Fit", key: "suggestedTier" },
    ],
  },
  {
    title: "Timeline",
    rows: [
      { label: "Start Timeframe", key: "startSoon" },
      { label: "Deadline", key: "deadline" },
      { label: "Deadline Date", key: "deadlineDate" },
      { label: "Turnaround", key: "turnaround" },
    ],
  },
  {
    title: "Creative direction",
    rows: [
      { label: "References", key: "references" },
      { label: "Tone / Style", key: "tone" },
      { label: "Additional Notes", key: "notes" },
    ],
  },
]

export function display(f: BriefForm, key: Key): string {
  if (key === "addOns") return f.addOns?.includes("producer") ? "Producer Services ($400–$600)" : "—"
  if (key === "budgetTier" && f.budgetTier) return `${f.budgetTier}${f.tierTentative ? " (tentative)" : ""}`
  const v = f[key]
  if (typeof v === "boolean") return v ? "Yes" : "No"
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—"
  return typeof v === "string" && v.trim() ? v.trim() : "—"
}

// ---------- Parsing a pasted brief email ----------

const ACKS: { label: string; key: "depositAck" | "revisionAck" | "responseAck" }[] = [
  { label: "Deposit Acknowledged", key: "depositAck" },
  { label: "Revision Policy Acknowledged", key: "revisionAck" },
  { label: "Response Window Acknowledged", key: "responseAck" },
]

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")
const clean = (v: string) => {
  const t = v.trim()
  return t === "—" || t === "-" || t === "–" ? "" : t
}

// Finds "Label: value", "Label<TAB>value", or "Label" on one line with the value on the next.
function reader(text: string) {
  const lines = text.replace(/\r/g, "").split("\n").map((l) => l.trim())
  return (label: string): string => {
    const inline = new RegExp(`^${esc(label)}\\s*[:\\t]\\s*(.*)$`, "i")
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(inline)
      if (m) return clean(m[1] || lines[i + 1] || "")
      if (lines[i].toLowerCase() === label.toLowerCase()) return clean(lines[i + 1] ?? "")
    }
    return ""
  }
}

export function parseBriefEmail(text: string): { form: BriefForm; found: number } {
  const get = reader(text)
  const form: BriefForm = { ...INITIAL_FORM }
  let found = 0

  for (const section of SECTIONS) {
    for (const { label, key } of section.rows) {
      const v = get(label)
      if (!v) continue
      found++
      if (key === "addOns") {
        form.addOns = /producer/i.test(v) ? ["producer"] : []
      } else if (key === "projectType" || key === "tone") {
        form[key] = v.split(/,\s*/).filter(Boolean)
      } else if (key === "budgetTier") {
        const name = v.replace(/\s*\(.*\)\s*$/, "").trim()
        if (BUDGET_TIERS.some((t) => t.name === name)) {
          form.budgetTier = name
          form.tierTentative = /tentative/i.test(v)
        }
      } else if (typeof INITIAL_FORM[key] === "string") {
        ;(form as Record<string, unknown>)[key] = v
      }
    }
  }
  for (const { label, key } of ACKS) form[key] = /^yes/i.test(get(label))

  return { form, found }
}

// Server actions receive plain objects from the browser: keep only known fields of the right type.
export function pickForm(input: unknown): BriefForm {
  const src = (input && typeof input === "object" ? input : {}) as Record<string, unknown>
  const out = { ...INITIAL_FORM } as Record<string, unknown>
  for (const [k, def] of Object.entries(INITIAL_FORM)) {
    const v = src[k]
    if (typeof def === "string" && typeof v === "string") out[k] = v.slice(0, 5000)
    else if (typeof def === "boolean" && typeof v === "boolean") out[k] = v
    else if (Array.isArray(def) && Array.isArray(v)) out[k] = v.filter((x) => typeof x === "string").slice(0, 20)
  }
  return out as BriefForm
}
