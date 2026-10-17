"use client"

import { useState, useTransition } from "react"
import { shareTrackerWithClient } from "@/app/admin/actions"

type Status = { kind: "idle" } | { kind: "sent"; email: string } | { kind: "error"; message: string }

export function ShareTrackerButton({ briefId, clientEmail }: { briefId: string; clientEmail: string | null }) {
  const [status, setStatus] = useState<Status>({ kind: "idle" })
  const [pending, startTransition] = useTransition()

  if (!clientEmail) return <p className="mt-2 font-sans text-xs text-white/30">No client email on file</p>

  const share = () => {
    setStatus({ kind: "idle" })
    startTransition(async () => {
      try {
        const result = await shareTrackerWithClient(briefId)
        setStatus(result.ok ? { kind: "sent", email: clientEmail } : { kind: "error", message: result.error })
      } catch {
        setStatus({ kind: "error", message: "Something went wrong. Please try again." })
      }
    })
  }

  return (
    <div className="mt-2 flex flex-col gap-1">
      <button
        type="button"
        onClick={share}
        disabled={pending}
        className="inline-flex w-fit items-center gap-1.5 font-sans text-[11px] font-medium text-brand transition-opacity hover:opacity-70 disabled:cursor-wait disabled:opacity-40"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
        {pending ? "Sending…" : status.kind === "sent" ? "Send again" : "Email tracker ID to client"}
      </button>
      <p role="status" aria-live="polite" className="m-0 min-h-[1em] font-sans text-[11px]">
        {status.kind === "sent" && <span className="text-emerald-500">Sent to {status.email}</span>}
        {status.kind === "error" && <span className="text-red-400">{status.message}</span>}
      </p>
    </div>
  )
}
