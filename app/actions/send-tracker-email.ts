"use server"

import { Resend } from "resend"

const FONT = "-apple-system,Arial,sans-serif"

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)
}

function buildTrackerEmailHtml(name: string, trackerId: string): string {
  const firstName = escapeHtml(name.trim().split(" ")[0] || "there")
  const digitBoxes = trackerId
    .split("")
    .map(
      (d) =>
        `<td style="padding:0 4px;"><div style="width:44px;height:56px;background:#2b2620;border:1.5px solid #B5520A;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;font:700 28px/1 Georgia,serif;color:#B5520A;">${d}</div></td>`,
    )
    .join("")

  return `<!doctype html><html><body style="margin:0;background:#f4f1ea;padding:32px 0;font-family:${FONT};">
    <table role="presentation" width="520" align="center" cellpadding="0" cellspacing="0" style="background:#fffdf8;border:1px solid #eadfce;border-radius:10px;overflow:hidden;">
      <tr><td style="background:#2b2620;padding:20px 28px;">
        <div style="font:700 18px/1.2 Georgia,serif;color:#B5520A;">NJENGA Productions Co.</div>
        <div style="font:400 12px/1.4 ${FONT};color:rgba(255,255,255,0.5);margin-top:3px;">Content that builds brands.</div>
      </td></tr>
      <tr><td style="padding:32px 28px 8px;">
        <div style="font:700 22px/1.3 Georgia,serif;color:#2b2620;">Your project is in motion, ${firstName}.</div>
        <div style="font:400 14px/1.6 ${FONT};color:#6b6257;margin-top:10px;">We've received your brief and are reviewing everything now. Use the code below to track your project at any time:</div>
      </td></tr>
      <tr><td style="padding:20px 28px;">
        <div style="font:600 11px/1 ${FONT};color:#8a8172;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:12px;">Your Project Tracker ID</div>
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>${digitBoxes}</tr></table>
        <div style="margin-top:14px;">
          <a href="https://njengapro.co/track" style="display:inline-block;background:#B5520A;color:#fffdf8;font:600 13px/1 ${FONT};text-decoration:none;padding:10px 22px;border-radius:6px;">Track My Project →</a>
        </div>
        <div style="margin-top:10px;font:400 12px/1.5 ${FONT};color:#8a8172;">Or go to <strong>njengapro.co/track</strong> and enter your 6-digit code.</div>
      </td></tr>
      <tr><td style="padding:20px 28px;border-top:1px solid #eadfce;">
        <div style="font:400 12px/1.6 ${FONT};color:#8a8172;">Expect to hear from us within <strong>24–48 hours</strong> to schedule your pre-production call. Reply to this email with any questions.</div>
      </td></tr>
      <tr><td style="padding:12px 28px 20px;background:#f9f6f0;border-top:1px solid #eadfce;">
        <div style="font:400 11px/1.5 ${FONT};color:#a09486;">NJENGA Productions Co. · Pittsburgh, PA · njengapro.co</div>
      </td></tr>
    </table>
  </body></html>`
}

export async function sendTrackerEmail(
  email: string,
  name: string,
  trackerId: string,
): Promise<{ ok: boolean }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || !trackerId || !/^\d{6}$/.test(trackerId)) return { ok: false }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false }
  try {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from: "NJENGA Productions Co. <hello@njengapro.co>",
      to: email,
      subject: `Your NJENGA project tracker — code ${trackerId}`,
      html: buildTrackerEmailHtml(name, trackerId),
    })
    if (error) {
      console.log("[v0] sendTrackerEmail error:", JSON.stringify(error))
      return { ok: false }
    }
    return { ok: true }
  } catch (err) {
    console.log("[v0] sendTrackerEmail exception:", err)
    return { ok: false }
  }
}
