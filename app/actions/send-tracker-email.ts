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
        `<td style="padding:0 3px;"><div style="width:42px;height:54px;background:#161310;border:1.5px solid rgba(177,89,39,0.5);border-radius:6px;display:inline-flex;align-items:center;justify-content:center;font:700 26px/1 Georgia,serif;color:#D35F22;">${d}</div></td>`,
    )
    .join("")

  return `<!doctype html><html><head><style>@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,700;1,400&family=Poppins:wght@300;500;600;700&display=swap');</style></head><body style="margin:0;background:#0A0806;padding:32px 0;">
    <table role="presentation" width="560" align="center" cellpadding="0" cellspacing="0" style="background:#0E0C09;border-radius:10px;overflow:hidden;">
      <tr><td style="height:2px;background:linear-gradient(90deg,#D35F22 0%,#B15927 40%,#8C6E6F 100%);font-size:0;line-height:0;">&nbsp;</td></tr>
      <tr><td style="padding:22px 36px 20px;border-bottom:1px solid rgba(255,255,255,0.06);">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td><span style="font:700 14px/1 'Poppins',Arial,sans-serif;letter-spacing:0.12em;text-transform:uppercase;color:#D35F22;">NJENGA</span><span style="font:400 11px/1 'Lora',Georgia,serif;font-style:italic;color:#957D7D;margin-left:5px;">Productions Co.</span></td>
          <td align="right"><span style="font:600 9px/1 'Poppins',Arial,sans-serif;letter-spacing:0.14em;text-transform:uppercase;color:#B15927;border:1px solid rgba(177,89,39,0.35);border-radius:20px;padding:3px 10px;">Project Tracker</span></td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:36px 36px 0;">
        <div style="font:600 9px/1 'Poppins',Arial,sans-serif;letter-spacing:0.18em;text-transform:uppercase;color:#B15927;margin-bottom:14px;">Your Project</div>
        <div style="font:700 27px/1.2 'Lora',Georgia,serif;color:#F2EDE5;margin-bottom:10px;">Your project is <em style="font-style:italic;color:#D35F22;">in motion</em>, ${firstName}.</div>
        <div style="font:300 13px/1.7 'Poppins',Arial,sans-serif;color:rgba(232,226,216,0.5);max-width:380px;margin-bottom:32px;">We've received your brief and are reviewing everything. Use the code below to track your project at any time from any device.</div>
      </td></tr>
      <tr><td style="padding:0 36px 32px;">
        <div style="background:#161310;border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:20px 20px 24px;">
          <div style="font:600 9px/1 'Poppins',Arial,sans-serif;letter-spacing:0.14em;text-transform:uppercase;color:#8C6E6F;margin-bottom:14px;">Your Tracker Code</div>
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>${digitBoxes}</tr></table>
          <div style="margin-top:10px;font:300 11px/1.5 'Poppins',Arial,sans-serif;color:rgba(232,226,216,0.28);">Enter this code at njengapro.co/track</div>
        </div>
        <div style="margin-top:20px;">
          <a href="https://njengapro.co/track" style="display:inline-block;background:linear-gradient(135deg,#D35F22 0%,#B15927 100%);color:#fff;font:600 11px/1 'Poppins',Arial,sans-serif;letter-spacing:0.05em;text-transform:uppercase;text-decoration:none;padding:12px 24px;border-radius:6px;">Track My Project →</a>
        </div>
      </td></tr>
      <tr><td style="padding:20px 36px;border-top:1px solid rgba(255,255,255,0.05);">
        <div style="font:300 12px/1.6 'Poppins',Arial,sans-serif;color:rgba(232,226,216,0.38);">Expect to hear from us within <span style="color:rgba(232,226,216,0.65);font-weight:500;">24–48 hours</span> to schedule your pre-production call. Reply to this email with any questions.</div>
      </td></tr>
      <tr><td style="padding:14px 36px 20px;border-top:1px solid rgba(255,255,255,0.04);">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td><div style="font:400 10px/1.5 'Poppins',Arial,sans-serif;color:rgba(232,226,216,0.18);">NJENGA Productions Co. · Pittsburgh, PA · njengapro.co</div></td>
          <td align="right"><div style="font:400 10px/1 'Lora',Georgia,serif;font-style:italic;color:rgba(177,89,39,0.4);">Content that builds brands.</div></td>
        </tr></table>
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
