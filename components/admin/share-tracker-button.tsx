"use client"

import { useState, useTransition } from "react"
import { shareTrackerWithClient } from "@/app/admin/actions"

type Status = { kind: "idle" } | { kind: "sent"; email: string } | { kind: "error"; message: string }

export function ShareTrackerButton({ briefId, clientEmail }: { briefId: string; clientEmail: string }) {
  const [status, setStatus] = useState<Status>({ kind: "idle" })
  const [pending, startTransition] = useTransition()

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
    <div className="mt-3 flex flex-col gap-2">
      <button
        type="button"
        onClick={share}
        disabled={pending}
        className="flex w-fit items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 font-sans text-xs font-medium text-white/70 transition-colors hover:border-brand/40 hover:bg-brand/10 hover:text-brand disabled:cursor-wait disabled:opacity-60"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
        {pending ? "Sending…" : status.kind === "sent" ? "Send again" : "Share this ID with the client"}
      </button>
      <p role="status" aria-live="polite" className="m-0 min-h-[1em] font-sans text-[12px]">
        {status.kind === "sent" && <span className="text-emerald-400">Tracker ID sent to {status.email}</span>}
        {status.kind === "error" && <span className="text-red-400">{status.message}</span>}
      </p>
    </div>
  )
}
