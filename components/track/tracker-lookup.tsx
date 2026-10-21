"use client"

import { useState, type FormEvent } from "react"

type Stage = {
  key: string
  label: string
  done: boolean
  date?: string
  note?: string
  noteVisible?: boolean
}
type Tracker = { name: string; budget_tier: string | null; tracker_id: string; tracker_stages: Stage[] }

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "not_found"; code: string }
  | { kind: "error" }
  | { kind: "found"; data: Tracker }

const fmtDate = (d: string) => {
  const date = new Date(d)
  return Number.isNaN(date.getTime())
    ? d
  : date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      // Date-only strings parse as UTC midnight; format in UTC so the stored calendar day is shown as-is.
      timeZone: /^\d{4}-\d{2}-\d{2}$/.test(d) ? "UTC" : "America/New_York",
    })
  }

export function TrackerLookup() {
  const [code, setCode] = useState("")
  const [state, setState] = useState<State>({ kind: "idle" })

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!/^\d{6}$/.test(code)) return
    setState({ kind: "loading" })
    try {
      const res = await fetch(`/api/tracker/${code}`, { cache: "no-store" })
      if (res.status === 404) return setState({ kind: "not_found", code })
      if (!res.ok) return setState({ kind: "error" })
      setState({ kind: "found", data: (await res.json()) as Tracker })
    } catch {
      setState({ kind: "error" })
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={onSubmit} className="space-y-2">
        <label htmlFor="project-id" className="block font-sans text-[12px] font-semibold uppercase tracking-wider text-white/60">
          Enter your Project ID
        </label>
        <div className="flex gap-2">
          <input
            id="project-id"
            inputMode="numeric"
            autoComplete="off"
            pattern="\d{6}"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="min-w-0 flex-1 rounded-md border border-white/15 bg-white/5 px-4 py-3 font-mono text-xl tracking-[0.4em] text-white placeholder:text-white/20 focus:border-[#B15927] focus:outline-none focus:ring-2 focus:ring-[#B15927]/40"
          />
          <button
            type="submit"
            disabled={code.length !== 6 || state.kind === "loading"}
            className="rounded-md bg-[#B15927] px-5 py-3 font-sans text-sm font-bold text-white transition-colors hover:bg-[#B15927]/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {state.kind === "loading" ? "Checking…" : "Track"}
          </button>
        </div>
      </form>

      <div aria-live="polite">
        {state.kind === "not_found" && (
          <p className="m-0 rounded-md border border-white/10 bg-white/5 p-4 font-sans text-sm text-white/80">
            No project found for ID {state.code}. Please check your ID and try again.
          </p>
        )}
        {state.kind === "error" && (
          <p className="m-0 rounded-md border border-white/10 bg-white/5 p-4 font-sans text-sm text-white/80">
            Something went wrong. Please try again in a moment.
          </p>
        )}
        {state.kind === "found" && <TrackerResult data={state.data} />}
      </div>
    </div>
  )
}

function TrackerResult({ data }: { data: Tracker }) {
  const stages = data.tracker_stages
  const doneCount = stages.filter((s) => s.done).length
  const pct = stages.length ? Math.round((doneCount / stages.length) * 100) : 0
  const currentIdx = stages.findIndex((s) => !s.done)

  return (
    <section className="rounded-lg border border-white/[0.07] bg-[#161311] p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 font-serif text-2xl font-semibold">{data.name}</h2>
        {data.budget_tier && (
          <span className="rounded-full border border-[#B15927]/50 bg-[#B15927]/15 px-3 py-1 font-sans text-[11px] font-semibold uppercase tracking-wider text-[#e08a5a]">
            {data.budget_tier}
          </span>
        )}
      </div>

      <div className="mt-5">
        <div className="mb-2 flex justify-between font-sans text-[12px] text-white/60">
          <span>Progress</span>
          <span>{pct}%</span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Project progress"
        >
          <div className="h-full rounded-full bg-[#B15927] transition-[width] duration-700" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <ol className="mt-6 space-y-0">
        {stages.map((s, i) => {
          const inProgress = i === currentIdx
          return (
            <li key={s.key} className="border-b border-white/5 py-3 last:border-b-0">
              <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3 flex-shrink-0 items-center justify-center" aria-hidden="true">
                {s.done ? (
                  <span className="h-3 w-3 rounded-full bg-[#B15927]" />
                ) : inProgress ? (
                  <>
                    <span className="absolute h-3 w-3 animate-ping rounded-full bg-emerald-400/60" />
                    <span className="h-3 w-3 rounded-full bg-emerald-400" />
                  </>
                ) : (
                  <span className="h-3 w-3 rounded-full border border-white/30" />
                )}
              </span>
              <span className={`flex-1 font-sans text-sm ${s.done ? "text-white/50 line-through" : inProgress ? "font-semibold text-white" : "text-white/70"}`}>
                {s.label}
                <span className="sr-only">{s.done ? " (complete)" : inProgress ? " (in progress)" : " (pending)"}</span>
              </span>
              <span className={`font-sans text-[12px] ${inProgress && !s.date ? "text-emerald-400" : "text-white/40"}`}>
                {s.date ? fmtDate(s.date) : inProgress ? "In progress" : "—"}
              </span>
              </div>
              {s.note && s.noteVisible && (
                <p className="mt-1 pl-6 font-sans text-[12px] leading-snug text-white/60">{s.note}</p>
              )}
            </li>
          )
        })}
      </ol>
      <div className="mt-5 border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="flex items-center gap-1.5 font-sans text-[12px] text-white/40 transition-colors hover:text-white/70"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
          Look up another ID
        </button>
      </div>
    </section>
  )
}
