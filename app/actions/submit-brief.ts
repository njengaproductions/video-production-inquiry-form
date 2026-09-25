"use server"

// app/actions/submit-brief.ts — Step C
// Changes vs. current:
//  1. Accepts docGaps (AI ambiguities from the uploaded SOW) alongside the form.
//  2. Computes structural gaps + meeting plan server-side (gaps.ts).
//  3. Producer email now opens with a PRE-PRO PACKET: meeting type, approver flag,
//     agenda from gaps, draft quote range from the rate card.
//  4. Subject line encodes meeting type + open-gap count for matching to the calendar booking.
//  5. Returns the meeting plan so the success screen can show the right booking page (step E).

import { Resend } from "resend"
import { BUDGET_TIERS, type BriefForm } from "@/components/brief/data"
import { normalizeForm, planMeeting, structuralGaps, type Gap, type MeetingPlan } from "@/components/brief/gaps"

const TO_EMAIL = "njengaproductions@gmail.com"

type Row = { label: string; value: string }

function fmt(value: string | string[] | boolean): string {
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—"
  return value.trim() || "—"
}

// docGaps arrive from the client, so treat them as untrusted: cap count and length.
function sanitizeDocGaps(input: unknown): Gap[] {
  if (!Array.isArray(input)) return []
  const clip = (s: unknown, n: number) => (typeof s === "string" ? s.trim().slice(0, n) : "")
  return input.slice(0, 10).flatMap((g, i) => {
    const label = clip(g?.label, 200)
    if (!label) return []
    return [
      {
        id: `doc-${i}`,
        severity: g?.severity === "critical" ? "critical" : "minor",
        label,
        agenda: clip(g?.agenda, 200) || label,
        source: "document" as const,
      },
    ]
  })
}

// Draft quote range straight from BUDGET_TIERS — a starting point for the meeting, not a quote.
function quoteRange(f: BriefForm): string {
  const tier = BUDGET_TIERS.find((t) => t.name === f.budgetTier)
  const rush = f.turnaround.startsWith("Rush") ? " + rush fee (TBD)" : ""
  if (tier) {
    if (tier.name === "Edit Only") return `$50/hr — quote after footage review${rush}`
    if (tier.name === "Premium") return `$5K+ — custom quote${rush}`
    const producer =
      tier.name === "Shoot Only" && f.addOns.includes("producer") ? " + Producer Services $400–$600" : ""
    return `${tier.range} (${tier.name})${producer}${rush}`
  }
  if (f.customBudget.trim()) return `Client-stated: ${f.customBudget.trim()} — custom, map to deliverables${rush}`
  return "No budget given — establish in meeting"
}

function buildRows(form: BriefForm): { section: string; rows: Row[] }[] {
  return [
    {
      section: "About You",
      rows: [
        { label: "Full Name", value: fmt(form.fullName) },
        { label: "Email", value: fmt(form.email) },
        { label: "Phone", value: fmt(form.phone) },
        { label: "Preferred Contact", value: fmt(form.contactMethod) },
        { label: "Heard About Us", value: fmt(form.heardFrom) },
        { label: "Referred By", value: fmt(form.referral) },
        { label: "Decision Maker", value: fmt(form.decisionMaker) },
        { label: "Final Approver", value: fmt(form.approver) },
      ],
    },
    {
      section: "Your Project",
      rows: [
        { label: "Service Type", value: fmt(form.serviceType) },
        { label: "Project Type", value: fmt(form.projectType) },
        { label: "Project / Event Date", value: fmt(form.projectDate) },
        { label: "Location", value: fmt(form.location) },
        { label: "Indoor / Outdoor", value: fmt(form.indoorOutdoor) },
        { label: "Subjects / People", value: fmt(form.subjects) },
        { label: "Script / Voiceover", value: fmt(form.voiceover) },
        { label: "Worked With Videographer Before", value: fmt(form.priorVideographer) },
        { label: "Project Description", value: fmt(form.projectDesc) },
      ],
    },
    {
      section: "Budget",
      rows: [
        { label: "Selected Tier", value: fmt(form.budgetTier) },
        { label: "Add-Ons", value: fmt(form.addOns?.includes("producer") ? "Producer Services ($400–$600)" : "") },
        { label: "Custom Budget", value: fmt(form.customBudget) },
        { label: "Custom Description", value: fmt(form.customDesc) },
      ],
    },
    {
      section: "Timeline & Urgency",
      rows: [
        { label: "Start Timeframe", value: fmt(form.startSoon) },
        { label: "Deadline", value: fmt(form.deadline) },
        { label: "Deadline Date", value: fmt(form.deadlineDate) },
        { label: "Turnaround", value: fmt(form.turnaround) },
      ],
    },
    {
      section: "Creative Direction",
      rows: [
        { label: "References", value: fmt(form.references) },
        { label: "Tone / Style", value: fmt(form.tone) },
        { label: "Additional Notes", value: fmt(form.notes) },
      ],
    },
    {
      section: "Agreements",
      rows: [
        { label: "Deposit Acknowledged", value: fmt(form.depositAck) },
        { label: "Revision Policy Acknowledged", value: fmt(form.revisionAck) },
        { label: "Response Window Acknowledged", value: fmt(form.responseAck) },
      ],
    },
  ]
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

const FONT = "-apple-system,Arial,sans-serif"

function gapListHtml(gaps: Gap[], color: string): string {
  if (!gaps.length) return `<div style="font:400 13px/1.5 ${FONT};color:#8a8172;">None</div>`
  return gaps
    .map(
      (g) => `
      <div style="border-left:3px solid ${color};padding:4px 0 4px 10px;margin:0 0 8px 0;">
        <div style="font:600 13px/1.4 ${FONT};color:#2b2620;">${escapeHtml(g.agenda)}</div>
        <div style="font:400 11px/1.4 ${FONT};color:#8a8172;">${escapeHtml(g.label)} · ${g.source === "document" ? "from SOW" : "from form"}</div>
      </div>`,
    )
    .join("")
}

function packetHtml(gaps: Gap[], plan: MeetingPlan, quote: string): string {
  const critical = gaps.filter((g) => g.severity === "critical")
  const minor = gaps.filter((g) => g.severity === "minor")
  const approver = plan.bringApprover
    ? `<div style="margin-top:8px;font:700 12px/1.4 ${FONT};color:#B5520A;">⚠ Client is not the decision maker — get the approver on the call.</div>`
    : ""
  return `
    <tr><td style="padding:24px 24px 4px 24px;">
      <div style="background:#f4f1ea;border:1px solid #eadfce;border-radius:8px;padding:16px;">
        <div style="font:700 13px/1.4 Georgia,serif;color:#B5520A;text-transform:uppercase;letter-spacing:0.05em;">Pre-Pro Packet</div>
        <div style="margin-top:8px;font:600 14px/1.4 ${FONT};color:#2b2620;">
          Meeting: ${plan.type === "full" ? "Full" : "Quick"} (${plan.minutes} min) · ${critical.length} critical / ${minor.length} minor gaps
        </div>
        <div style="margin-top:4px;font:400 13px/1.4 ${FONT};color:#2b2620;">Draft range: ${escapeHtml(quote)}</div>
        ${approver}
        <div style="margin-top:14px;font:700 12px/1.4 ${FONT};color:#6b6257;text-transform:uppercase;">Agenda — must resolve</div>
        <div style="margin-top:6px;">${gapListHtml(critical, "#B5520A")}</div>
        <div style="margin-top:10px;font:700 12px/1.4 ${FONT};color:#6b6257;text-transform:uppercase;">Agenda — clarify if time</div>
        <div style="margin-top:6px;">${gapListHtml(minor, "#8C7266")}</div>
      </div>
    </td></tr>`
}

function buildHtml(form: BriefForm, gaps: Gap[], plan: MeetingPlan, quote: string): string {
  const sections = buildRows(form)
    .map(
      ({ section, rows }) => `
      <tr><td style="padding:24px 24px 8px 24px;">
        <div style="font:700 13px/1.4 Georgia,serif;color:#B5520A;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #eadfce;padding-bottom:6px;">${escapeHtml(section)}</div>
      </td></tr>
      ${rows
        .map(
          (r) => `
        <tr><td style="padding:6px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="200" style="font:600 12px/1.5 ${FONT};color:#6b6257;vertical-align:top;padding-right:12px;">${escapeHtml(r.label)}</td>
              <td style="font:400 13px/1.5 ${FONT};color:#2b2620;vertical-align:top;white-space:pre-wrap;">${escapeHtml(r.value)}</td>
            </tr>
          </table>
        </td></tr>`,
        )
        .join("")}`,
    )
    .join("")

  return `<!doctype html><html><body style="margin:0;background:#f4f1ea;padding:24px 0;">
    <table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0" style="background:#fffdf8;border:1px solid #eadfce;border-radius:10px;overflow:hidden;">
      <tr><td style="background:#2b2620;padding:20px 24px;">
        <div style="font:700 18px/1.2 Georgia,serif;color:#B5520A;">NJENGA Productions Co.</div>
        <div style="font:400 12px/1.4 ${FONT};color:rgba(255,255,255,0.55);margin-top:4px;">New Client Project Brief</div>
      </td></tr>
      ${packetHtml(gaps, plan, quote)}
      ${sections}
      <tr><td style="padding:20px 24px;border-top:1px solid #eadfce;font:400 11px/1.5 ${FONT};color:#8a8172;">
        Submitted via the Client Project Brief form.
      </td></tr>
    </table>
  </body></html>`
}

function buildText(form: BriefForm, gaps: Gap[], plan: MeetingPlan, quote: string): string {
  const list = (sev: Gap["severity"]) =>
    gaps
      .filter((g) => g.severity === sev)
      .map((g) => `  - ${g.agenda} [${g.source === "document" ? "SOW" : "form"}]`)
      .join("\n") || "  - None"
  const packet = [
    "PRE-PRO PACKET",
    `  Meeting: ${plan.type === "full" ? "Full" : "Quick"} (${plan.minutes} min)`,
    `  Draft range: ${quote}`,
    plan.bringApprover ? "  ! Client is not the decision maker — get the approver on the call." : "",
    "  Must resolve:",
    list("critical"),
    "  Clarify if time:",
    list("minor"),
  ]
    .filter(Boolean)
    .join("\n")

  const body = buildRows(form)
    .map(({ section, rows }) => `${section.toUpperCase()}\n${rows.map((r) => `  ${r.label}: ${r.value}`).join("\n")}`)
    .join("\n\n")

  return `${packet}\n\n${body}`
}

export async function submitBrief(
  rawForm: BriefForm,
  rawDocGaps: unknown = [],
): Promise<{ ok: true; meeting: MeetingPlan } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { ok: false, error: "Email service is not configured yet." }

  if (!rawForm.fullName?.trim() || !rawForm.email?.trim()) {
    return { ok: false, error: "Missing required contact details." }
  }

  const form = normalizeForm(rawForm)
  const gaps = [...structuralGaps(form), ...sanitizeDocGaps(rawDocGaps)]
  const plan = planMeeting(gaps)
  const quote = quoteRange(form)

  const resend = new Resend(apiKey)
  const from = "NJENGA Brief <onboarding@resend.dev>"

  const clientEmail = form.email.trim()
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)

  // Subject is built to match the calendar booking at a glance.
  const subject =
    `[${plan.type === "full" ? "Full 60" : "Quick 30"}] ${form.fullName.trim()} — ` +
    `${gaps.length} open gap${gaps.length === 1 ? "" : "s"}` +
    `${form.budgetTier ? ` (${form.budgetTier})` : ""}`

  try {
    const { error } = await resend.emails.send({
      from,
      to: TO_EMAIL,
      ...(isValidEmail ? { replyTo: clientEmail } : {}),
      subject,
      html: buildHtml(form, gaps, plan, quote),
      text: buildText(form, gaps, plan, quote),
    })

    if (error) {
      console.log("[v0] Resend send error:", JSON.stringify(error))
      return { ok: false, error: "We couldn't send your brief. Please try again." }
    }

    return { ok: true, meeting: plan }
  } catch (err) {
    console.log("[v0] submitBrief exception:", err)
    return { ok: false, error: "Something went wrong. Please try again." }
  }
}
