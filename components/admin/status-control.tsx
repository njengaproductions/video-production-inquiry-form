"use client"

// components/admin/status-control.tsx — every status change asks for confirmation first.
import { useState, useTransition } from "react"
import { changeStatus } from "@/app/admin/actions"
import { STATUSES, STATUS_LABEL, type BriefStatus } from "@/lib/brief-status"

export function StatusControl({ id, status }: { id: string; status: BriefStatus }) {
  const [current, setCurrent] = useState<BriefStatus>(status)
  const [pending, setPending] = useState<BriefStatus | null>(null)
  const [error, setError] = useState("")
  const [busy, startTransition] = useTransition()

  const confirm = () => {
    if (!pending) return
    const next = pending
    setError("")
    startTransition(async () => {
      const r = await changeStatus(id, next)
      if (r.ok) {
        setCurrent(next)
        setPending(null)
      } else {
        setError(r.error)
      }
    })
  }

  return (
    <div>
      <div role="group" aria-label="Brief status" className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            disabled={busy}
            aria-pressed={s === current}
            onClick={() => s !== current && setPending(s)}
            className={`rounded-full border px-4 py-1.5 font-sans text-[13px] transition-colors ${
              s === current
                ? "border-brand bg-accent font-semibold text-brand"
                : "border-input bg-surface text-muted-foreground hover:border-brand/50"
            }`}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {pending && (
        <div role="alertdialog" aria-live="polite" className="mt-3 rounded-md border border-brand/40 bg-accent p-3">
          <p className="m-0 font-sans text-[13px] text-foreground">
            Move this brief from <strong>{STATUS_LABEL[current]}</strong> to <strong>{STATUS_LABEL[pending]}</strong>?
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={confirm}
              disabled={busy}
              className="rounded-md bg-brand px-4 py-1.5 font-sans text-[12px] font-semibold text-primary-foreground disabled:opacity-60"
            >
              {busy ? "Saving…" : "Confirm"}
            </button>
            <button
              type="button"
              onClick={() => setPending(null)}
              disabled={busy}
              className="rounded-md border border-input bg-surface px-4 py-1.5 font-sans text-[12px] text-muted-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 font-sans text-[12px] text-brand">
          {error}
        </p>
      )}
    </div>
  )
}
