"use server"

import { Resend } from "resend"
import type { BriefForm } from "@/components/brief/data"

const TO_EMAIL = "njengaproductions@gmail.com"

type Row = { label: string; value: string }

function fmt(value: string | string[] | boolean): string {
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—"
  return value.trim() || "—"
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
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function buildHtml(form: BriefForm): string {
  const groups = buildRows(form)
  const sections = groups
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
              <td width="200" style="font:600 12px/1.5 -apple-system,Arial,sans-serif;color:#6b6257;vertical-align:top;padding-right:12px;">${escapeHtml(r.label)}</td>
              <td style="font:400 13px/1.5 -apple-system,Arial,sans-serif;color:#2b2620;vertical-align:top;white-space:pre-wrap;">${escapeHtml(r.value)}</td>
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
        <div style="font:400 12px/1.4 -apple-system,Arial,sans-serif;color:rgba(255,255,255,0.55);margin-top:4px;">New Client Project Brief</div>
      </td></tr>
      ${sections}
      <tr><td style="padding:20px 24px;border-top:1px solid #eadfce;font:400 11px/1.5 -apple-system,Arial,sans-serif;color:#8a8172;">
        Submitted via the Client Project Brief form.
      </td></tr>
    </table>
  </body></html>`
}

function buildText(form: BriefForm): string {
  return buildRows(form)
    .map(({ section, rows }) => {
      const body = rows.map((r) => `  ${r.label}: ${r.value}`).join("\n")
      return `${section.toUpperCase()}\n${body}`
    })
    .join("\n\n")
}

export async function submitBrief(
  form: BriefForm,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { ok: false, error: "Email service is not configured yet." }
  }

  // Minimal server-side validation of required fields.
  if (!form.fullName?.trim() || !form.email?.trim()) {
    return { ok: false, error: "Missing required contact details." }
  }

  const resend = new Resend(apiKey)
  const from = process.env.BRIEF_FROM_EMAIL || "NJENGA Brief <onboarding@resend.dev>"

  try {
    const { error } = await resend.emails.send({
      from,
      to: TO_EMAIL,
      replyTo: form.email.trim(),
      subject: `New Project Brief — ${form.fullName.trim()}${form.budgetTier ? ` (${form.budgetTier})` : ""}`,
      html: buildHtml(form),
      text: buildText(form),
    })

    if (error) {
      console.log("[v0] Resend send error:", error)
      return { ok: false, error: "We couldn't send your brief. Please try again." }
    }

    return { ok: true }
  } catch (err) {
    console.log("[v0] submitBrief exception:", err)
    return { ok: false, error: "Something went wrong. Please try again." }
  }
}
