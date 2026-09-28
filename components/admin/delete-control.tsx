"use client"

// components/admin/delete-control.tsx
// Two-step deletion with safeguards:
//   1. "Delete brief" → type the client's name → moves to Trash (restorable).
//   2. From Trash → "Delete forever" → type the name again → permanently removed.
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { deleteForever, moveToTrash, restoreFromTrash } from "@/app/admin/actions"

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" })

function TypedConfirm({
  name,
  action,
  danger,
  busy,
  onConfirm,
  onCancel,
}: {
  name: string
  action: string
  danger: string
  busy: boolean
  onConfirm: (typed: string) => void
  onCancel: () => void
}) {
  const [typed, setTyped] = useState("")
  const match = typed.trim().toLowerCase() === name.trim().toLowerCase()
  return (
    <div role="alertdialog" aria-label={action} className="mt-3 rounded-md border border-brand/50 bg-accent p-3">
      <p className="m-0 font-sans text-[13px] text-foreground">{danger}</p>
      <label className="mt-3 block font-sans text-[12px] text-muted-foreground">
        Type <strong className="text-foreground">{name}</strong> to confirm
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          className="mt-1.5 block w-full rounded-md border border-input bg-field px-3 py-2 font-sans text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
        />
      </label>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={!match || busy}
          onClick={() => onConfirm(typed)}
          className="rounded-md bg-brand px-4 py-1.5 font-sans text-[12px] font-semibold text-primary-foreground disabled:cursor-default disabled:bg-input"
        >
          {busy ? "Working…" : action}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="rounded-md border border-input bg-surface px-4 py-1.5 font-sans text-[12px] text-muted-foreground"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export function DeleteControl({
  id,
  name,
  deletedAt,
  status,
}: {
  id: string
  name: string
  deletedAt: string | null
  status: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")
  const [busy, startTransition] = useTransition()

  const run = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>, then: () => void) =>
    startTransition(async () => {
      setError("")
      const r = await fn()
      if (r.ok) then()
      else setError(r.error)
    })

  // ----- Brief is in Trash -----
  if (deletedAt) {
    return (
      <section className="rounded-lg border-2 border-brand/60 bg-surface p-4 shadow-lg shadow-black/30">
        <p className="m-0 font-sans text-[13px] font-semibold text-brand">In Trash since {fmtDate(deletedAt)}</p>
        <p className="mt-1 mb-0 font-sans text-[12px] text-muted-foreground">
          Hidden from your lists. Restore it, or delete it forever.
        </p>
        {!open && (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => restoreFromTrash(id), () => router.refresh())}
              className="rounded-md bg-brand px-4 py-1.5 font-sans text-[12px] font-semibold text-primary-foreground disabled:opacity-60"
            >
              {busy ? "Restoring…" : "Restore"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-md border border-brand/50 bg-surface px-4 py-1.5 font-sans text-[12px] font-semibold text-brand"
            >
              Delete forever
            </button>
          </div>
        )}
        {open && (
          <TypedConfirm
            name={name}
            action="Delete forever"
            danger="This permanently removes the brief, its notes and history. It can't be undone."
            busy={busy}
            onCancel={() => setOpen(false)}
            onConfirm={(typed) => run(() => deleteForever(id, typed), () => router.push("/admin?status=trash"))}
          />
        )}
        {error && <p role="alert" className="mt-2 mb-0 font-sans text-[12px] text-brand">{error}</p>}
      </section>
    )
  }

  // ----- Normal brief: danger zone -----
  return (
    <section className="rounded-lg border border-hairline bg-surface p-4 shadow-lg shadow-black/30">
      <h2 className="mb-2 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-brand">Danger zone</h2>
      {!open ? (
        <div className="flex items-center justify-between gap-3">
          <p className="m-0 font-sans text-[12px] text-muted-foreground">
            Moves this brief to Trash. You can restore it later.
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex-shrink-0 rounded-md border border-brand/50 bg-surface px-4 py-1.5 font-sans text-[12px] font-semibold text-brand"
          >
            Delete brief
          </button>
        </div>
      ) : (
        <TypedConfirm
          name={name}
          action="Move to Trash"
          danger="This hides the brief from Active, Closed and Archived. You can restore it from Trash."
          busy={busy}
          onCancel={() => setOpen(false)}
          onConfirm={(typed) => run(() => moveToTrash(id, typed), () => router.push(`/admin?status=${status}`))}
        />
      )}
      {error && <p role="alert" className="mt-2 mb-0 font-sans text-[12px] text-brand">{error}</p>}
    </section>
  )
}
