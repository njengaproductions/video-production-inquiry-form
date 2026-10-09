"use client"

import { useState } from "react"
import { updateVoiceLogoDisplay } from "@/app/admin/voices/actions"
import { DEFAULT_LOGO_DISPLAY, LOGO_FITS, LOGO_OFFSET_RANGE, LOGO_SCALE_RANGE, logoImageStyle, type LogoDisplay } from "@/lib/logo-display"

const label = "text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
const nudgeButton = "flex h-6 w-6 items-center justify-center rounded border border-brand-border text-xs text-foreground hover:border-brand disabled:opacity-40"

function Nudge({ axis, value, onChange }: { axis: "X" | "Y"; value: number; onChange: (value: number) => void }) {
  const step = (delta: number) => onChange(Math.min(LOGO_OFFSET_RANGE.max, Math.max(LOGO_OFFSET_RANGE.min, value + delta)))
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-3 text-[10px] font-semibold text-muted-foreground">{axis}</span>
      <button type="button" aria-label={`Move logo ${axis === "X" ? "left" : "up"}`} disabled={value <= LOGO_OFFSET_RANGE.min} onClick={() => step(-LOGO_OFFSET_RANGE.step)} className={nudgeButton}>−</button>
      <span className="w-9 text-center font-mono text-[11px] tabular-nums text-foreground">{value}px</span>
      <button type="button" aria-label={`Move logo ${axis === "X" ? "right" : "down"}`} disabled={value >= LOGO_OFFSET_RANGE.max} onClick={() => step(LOGO_OFFSET_RANGE.step)} className={nudgeButton}>+</button>
    </div>
  )
}

export function LogoDisplayControls({ voiceId, logoUrl, alt, initial }: { voiceId: string; logoUrl: string; alt: string; initial: LogoDisplay }) {
  const [display, setDisplay] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const dirty = JSON.stringify(display) !== JSON.stringify(initial)
  const update = (patch: Partial<LogoDisplay>) => { setDisplay((current) => ({ ...current, ...patch })); setMessage("") }

  async function save() {
    setSaving(true)
    const result = await updateVoiceLogoDisplay(voiceId, display)
    setMessage(result.ok ? "Logo adjustments saved." : result.error)
    setSaving(false)
  }

  return (
    <fieldset className="mt-4 rounded-lg border border-border bg-background p-4">
      <legend className={`${label} px-1`}>Logo display</legend>
      <div className="flex gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-brand-border bg-[#0a0806]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} alt={`${alt} preview`} className="size-full" style={logoImageStyle(display)} />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <span className={label}>Fit</span>
            <div role="group" aria-label="Logo fit" className="flex overflow-hidden rounded border border-brand-border">
              {LOGO_FITS.map((fit) => (
                <button key={fit} type="button" aria-pressed={display.fit === fit} onClick={() => update({ fit })} className={`px-2.5 py-1 text-[11px] capitalize ${display.fit === fit ? "bg-brand text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {fit}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center justify-between gap-3">
            <span className={label}>Scale</span>
            <input type="range" min={LOGO_SCALE_RANGE.min} max={LOGO_SCALE_RANGE.max} step={LOGO_SCALE_RANGE.step} value={display.scale} onChange={(event) => update({ scale: Number(event.target.value) })} className="min-w-0 flex-1 accent-[var(--brand)]" />
            <span className="w-10 text-right font-mono text-[11px] tabular-nums text-foreground">{Math.round(display.scale * 100)}%</span>
          </label>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={label}>Offset</span>
            <div className="flex gap-3">
              <Nudge axis="X" value={display.position.x} onChange={(x) => update({ position: { ...display.position, x } })} />
              <Nudge axis="Y" value={display.position.y} onChange={(y) => update({ position: { ...display.position, y } })} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        {message && <p role="status" className="mr-auto text-[11px] text-muted-foreground">{message}</p>}
        <button type="button" onClick={() => update(DEFAULT_LOGO_DISPLAY)} className="rounded px-2.5 py-1.5 text-[11px] text-muted-foreground hover:text-foreground">Reset</button>
        <button type="button" disabled={saving || !dirty} onClick={() => void save()} className="rounded bg-brand px-3 py-1.5 text-[11px] font-semibold text-primary-foreground hover:bg-brand/90 disabled:opacity-50">
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </fieldset>
  )
}
