"use client"

// components/admin/import-tool.tsx — paste a past brief email → preview → confirm → saved as Archived.
import { useRef, useState, useTransition } from "react"
import { importBrief, parseImport, type ParsedImport } from "@/app/admin/actions"

type Preview = Extract<ParsedImport, { ok: true }>

const today = () => new Date().toISOString().slice(0, 10)
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" })

export function ImportTool() {
  const [text, setText] = useState("")
  const [preview, setPreview] = useState<Preview | null>(null)
  const [date, setDate] = useState(today())
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState<string[]>([])
  const [busy, startTransition] = useTransition()
  const box = useRef<HTMLTextAreaElement>(null)

  const reset = () => {
    setText("")
    setPreview(null)
    setConfirming(false)
    setDate(today())
    setError("")
    box.current?.focus()
  }

  const read = () =>
    startTransition(async () => {
      setError("")
      const r = await parseImport(text)
      if (r.ok) setPreview(r)
      else setError(r.error)
    })

  const save = () =>
    startTransition(async () => {
      if (!preview) return
      const r = await importBrief(preview.form, date)
      if (r.ok) {
        setDone((d) => [preview.form.fullName, ...d])
        reset()
      } else {
        setError(r.error)
        setConfirming(false)
      }
    })

  const f = preview?.form
  const budget = f ? (f.budgetTier || f.customBudget || "—") : ""

  return (
    <div>
      <ol className="mb-4 list-decimal space-y-1 pl-5 font-sans text-[13px] text-muted-foreground">
        <li>Open a past brief email in Gmail, select all the text, and copy it.</li>
        <li>Paste it below and press Read email.</li>
        <li>Check the preview, set the date it came in, and confirm.</li>
      </ol>

      <textarea
        ref={box}
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setPreview(null)
          setConfirming(false)
        }}
        rows={8}
        placeholder="Paste the brief email here…"
        className="w-full resize-y rounded-md border border-input bg-field px-3.5 py-2.5 font-sans text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
      />

      {!preview && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={read}
            disabled={busy || text.trim().length < 20}
            className="rounded-md bg-brand px-5 py-2 font-sans text-[13px] font-semibold text-primary-foreground disabled:cursor-default disabled:bg-input"
          >
            {busy ? "Reading…" : "Read email"}
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 font-sans text-[12px] text-brand">
          {error}
        </p>
      )}

      {preview && f && (
        <div className="brief-badge-in mt-4 rounded-lg border border-hairline bg-surface p-4">
          <p className="m-0 font-serif text-[16px] font-bold text-foreground">{f.fullName}</p>
          <p className="m-0 font-sans text-[12px] text-muted-foreground">{f.email || "No email found"}</p>
          <div className="mt-3 flex flex-wrap gap-1.5 font-sans text-[11px]">
            <span className="rounded-full bg-accent px-2 py-0.5 text-brand">{budget}</span>
            {f.serviceType && <span className="rounded-full bg-muted px-2 py-0.5">{f.serviceType}</span>}
            <span className="rounded-full bg-muted px-2 py-0.5">{preview.found} fields read</span>
            {preview.usedAI && <span className="rounded-full bg-muted px-2 py-0.5">Read by AI — double-check</span>}
          </div>

          {preview.duplicateOn && (
            <p className="mt-3 mb-0 rounded-md bg-accent p-2.5 font-sans text-[12px] text-brand">
              A brief from this email already exists ({fmtDate(preview.duplicateOn)}). Import only if this is a different
              project.
            </p>
          )}

          <label className="mt-4 block font-sans text-[12px] font-semibold text-foreground">
            Date this brief came in
            <input
              type="date"
              value={date}
              max={today()}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1.5 block rounded-md border border-input bg-field px-3 py-2 font-sans text-sm"
            />
          </label>

          {!confirming ? (
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="rounded-md bg-brand px-4 py-2 font-sans text-[13px] font-semibold text-primary-foreground"
              >
                Import as Archived
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-md border border-input bg-surface px-4 py-2 font-sans text-[13px] text-muted-foreground"
              >
                Discard
              </button>
            </div>
          ) : (
            <div role="alertdialog" className="mt-4 rounded-md border border-brand/40 bg-accent p-3">
              <p className="m-0 font-sans text-[13px]">
                Import <strong>{f.fullName}</strong> as <strong>Archived</strong>?
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={save}
                  disabled={busy}
                  className="rounded-md bg-brand px-4 py-1.5 font-sans text-[12px] font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {busy ? "Importing…" : "Confirm"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={busy}
                  className="rounded-md border border-input bg-surface px-4 py-1.5 font-sans text-[12px] text-muted-foreground"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {done.length > 0 && (
        <div className="mt-6" aria-live="polite">
          <p className="mb-2 font-sans text-[12px] font-semibold text-green">
            Imported this session ✓ ({done.length})
          </p>
          <ul className="space-y-1 font-sans text-[13px] text-muted-foreground">
            {done.map((n, i) => (
              <li key={`${n}-${i}`}>{n}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
