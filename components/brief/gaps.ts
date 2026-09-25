// components/brief/gaps.ts
// Step B1 — structural gap detection. Pure code, no AI: free, instant, predictable.
// Document ambiguities (step B2) come from extract-brief and share the same Gap shape.

import type { BriefForm } from "./data"

export type Gap = {
  id: string
  severity: "critical" | "minor"
  label: string // shown to the producer
  agenda: string // becomes a pre-pro agenda item
  clientQuestion?: string // asked back to the client in step D
  source: "form" | "document"
}

export type MeetingPlan = {
  type: "quick" | "full"
  minutes: 30 | 60
  bringApprover: boolean
}

const empty = (s: string) => !s.trim()
const is = (v: string, prefix: string) => v.startsWith(prefix)

export function structuralGaps(f: BriefForm): Gap[] {
  const gaps: Gap[] = []
  const add = (g: Omit<Gap, "source">) => gaps.push({ ...g, source: "form" })
  const editOnly = is(f.serviceType, "Edit Only") || f.budgetTier === "Edit Only"

  // ---- Critical ----
  if (is(f.serviceType, "Not sure"))
    add({
      id: "service-undecided",
      severity: "critical",
      label: "Service type undecided",
      agenda: "Decide scope: full production, shoot only, or edit only",
      clientQuestion: "Do you need us to film, edit, or both?",
    })

  if (!editOnly && empty(f.projectDate))
    add({
      id: "no-date",
      severity: "critical",
      label: "No shoot / event date",
      agenda: "Lock the shoot date or a date window",
      clientQuestion: "Do you have a date or date range for the shoot?",
    })

  if (!editOnly && empty(f.location))
    add({
      id: "no-location",
      severity: "critical",
      label: "No location",
      agenda: "Confirm location(s), access, and load-in",
      clientQuestion: "Where will we be filming? A city or venue is fine for now.",
    })

  if (is(f.decisionMaker, "No"))
    add({
      id: "approver",
      severity: "critical",
      label: f.approver.trim()
        ? `Final approver: ${f.approver.trim()}`
        : "Client is not the final decision maker — approver unknown",
      agenda: "Confirm who approves budget and creative, and their timeline",
      clientQuestion: "Who gives final approval, and can they join our planning call?",
    })

  if (is(f.deadline, "Yes") && empty(f.deadlineDate))
    add({
      id: "deadline-missing",
      severity: "critical",
      label: "Hard deadline stated but no date given",
      agenda: "Confirm delivery date and work the schedule backward",
      clientQuestion: "What date do you need the final video by?",
    })

  // Tier must agree with service type (e.g. "Edit Only" tier + "Full Production" service).
  const tierMismatch =
    (f.budgetTier === "Edit Only" && !is(f.serviceType, "Edit Only")) ||
    (f.budgetTier === "Shoot Only" && !is(f.serviceType, "Shoot Only")) ||
    (is(f.serviceType, "Edit Only") && f.budgetTier !== "" && f.budgetTier !== "Edit Only") ||
    (is(f.serviceType, "Shoot Only") && f.budgetTier !== "" && f.budgetTier !== "Shoot Only")
  if (tierMismatch && !is(f.serviceType, "Not sure"))
    add({
      id: "tier-mismatch",
      severity: "critical",
      label: `Budget tier (${f.budgetTier}) doesn't match service (${f.serviceType})`,
      agenda: "Reconcile service scope with budget tier",
    })

  // ---- Minor ----
  // Budget: no tier picked. A range with numbers is workable (minor);
  // anything without a number ("TBD", "not sure", blank) blocks quoting (critical).
  if (!f.budgetTier) {
    if (/\d/.test(f.customBudget))
      add({
        id: "custom-budget",
        severity: "minor",
        label: `Custom budget: ${f.customBudget.trim()}`,
        agenda: "Map the custom budget to deliverables",
      })
    else
      add({
        id: "no-budget-range",
        severity: "critical",
        label: f.customBudget.trim() ? `No usable budget range ("${f.customBudget.trim()}")` : "No budget range given",
        agenda: "Establish a working budget range before scoping",
        clientQuestion: "What budget range should we plan around?",
      })
  }

  if (f.budgetTier === "Premium")
    add({ id: "premium-quote", severity: "minor", label: "Premium tier — custom quote required", agenda: "Scope days, deliverables, and creative direction for a custom quote" })

  if (f.startSoon === "Just exploring for now")
    add({ id: "exploring", severity: "minor", label: "Early-stage lead (just exploring)", agenda: "Gauge commitment and realistic timeline" })

  if (is(f.turnaround, "Rush"))
    add({ id: "rush", severity: "minor", label: "Rush turnaround requested", agenda: "Confirm rush fee and feasibility" })

  if (f.voiceover === "Not sure")
    add({ id: "vo-undecided", severity: "minor", label: "Script / voiceover undecided", agenda: "Decide on script and VO, and who writes it" })

  if (!editOnly && empty(f.subjects) && f.projectType.some((t) => t === "Event Coverage" || t === "Wedding"))
    add({ id: "headcount", severity: "minor", label: "Guest / subject count unknown", agenda: "Estimate headcount for the crew and camera plan" })

  if (f.projectType.includes("Other"))
    add({ id: "type-other", severity: "minor", label: "Project type marked 'Other'", agenda: "Clarify the project type" })

  return gaps
}

// Pass structural + document gaps together.
export function planMeeting(gaps: Gap[]): MeetingPlan {
  const critical = gaps.filter((g) => g.severity === "critical").length
  const full = critical > 2
  return {
    type: full ? "full" : "quick",
    minutes: full ? 60 : 30,
    bringApprover: gaps.some((g) => g.id === "approver"),
  }
}

// Fix for bug #1: drop a hidden deadlineDate unless the client chose a hard deadline.
export function normalizeForm(f: BriefForm): BriefForm {
  return is(f.deadline, "Yes") ? f : { ...f, deadlineDate: "" }
}
