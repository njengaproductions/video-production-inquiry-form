"use client"

import { useState } from "react"
import type { GapFillResult } from "@/app/actions/fill-gaps"

type Suggestion = GapFillResult["suggestions"][number]

export function AiGapPanel({
  result,
  loading = false,
  onAccept,
  onDismiss,
}: {
  result: GapFillResult | null
  loading?: boolean
  onAccept: (field: Suggestion["field"], value: string) => void
  onDismiss: () => void
}) {
  const [accepted, setAccepted] = useState<Set<string>>(new Set())
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const visible = result?.suggestions.filter((suggestion) => !dismissed.has(`${suggestion.field}:${suggestion.suggestion}`)) ?? []

  if (!loading && !result) return null

  const readinessLabel = !result
    ? ""
    : result.overallReadiness === "strong"
      ? "Brief looks strong"
      : result.overallReadiness === "moderate"
        ? "A few gaps to fill"
        : "Brief needs more detail"

  return (
    <section aria-label="AI brief suggestions" className="ai-gap-panel">
      <div className="ai-gap-header">
        <span className="ai-gap-badge">AI suggestions</span>
        <span className="ai-gap-readiness" data-level={result?.overallReadiness}>
          {loading ? "Reviewing project details…" : readinessLabel}
        </span>
        <button type="button" className="ai-gap-close" onClick={onDismiss} aria-label="Close suggestions">
          ×
        </button>
      </div>
      <div className="ai-gap-list">
        {visible.map((suggestion) => (
          <div key={`${suggestion.field}:${suggestion.suggestion}`} className="ai-gap-item" data-accepted={accepted.has(`${suggestion.field}:${suggestion.suggestion}`)}>
            <p className="ai-gap-text">{suggestion.suggestion}</p>
            {!accepted.has(`${suggestion.field}:${suggestion.suggestion}`) ? (
              <button
                type="button"
                className="ai-gap-accept"
                onClick={() => {
                  setAccepted((previous) => new Set(previous).add(`${suggestion.field}:${suggestion.suggestion}`))
                  onAccept(suggestion.field, suggestion.suggestion)
                }}
              >
                Add to brief
              </button>
            ) : (
              <span className="ai-gap-done" role="status">Added</span>
            )}
            <button
              type="button"
              className="ai-gap-skip"
              onClick={() => setDismissed((previous) => new Set(previous).add(`${suggestion.field}:${suggestion.suggestion}`))}
              aria-label={`Dismiss ${suggestion.field} suggestion`}
            >
              ×
            </button>
          </div>
        ))}
        {!loading && result && visible.length === 0 && (
          <p className="ai-gap-text" style={{ padding: "10px 16px" }}>No additional details are needed right now.</p>
        )}
      </div>
      <style>{`
        .ai-gap-panel { margin: 1.5rem 0; border: 1px solid rgba(194,122,53,.35); border-radius: 8px; background: rgba(194,122,53,.06); overflow: hidden; }
        .ai-gap-header { display: flex; align-items: center; gap: 10px; padding: 10px 16px; border-bottom: 1px solid rgba(194,122,53,.2); }
        .ai-gap-badge { font-size: 10px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: #c27a35; background: rgba(194,122,53,.12); padding: 2px 8px; border-radius: 4px; }
        .ai-gap-readiness { flex: 1; font-size: 11px; color: rgba(255,255,255,.5); }
        .ai-gap-readiness[data-level="strong"] { color: rgba(100,220,120,.8); }
        .ai-gap-readiness[data-level="thin"] { color: rgba(220,100,80,.85); }
        .ai-gap-close, .ai-gap-skip { border: 0; background: none; color: rgba(255,255,255,.35); cursor: pointer; line-height: 1; }
        .ai-gap-close { padding: 0 2px; font-size: 18px; }
        .ai-gap-skip { flex-shrink: 0; padding: 0; font-size: 14px; }
        .ai-gap-close:hover, .ai-gap-skip:hover { color: rgba(255,255,255,.8); }
        .ai-gap-list { padding: 4px 0; }
        .ai-gap-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px 16px; border-bottom: 1px solid rgba(255,255,255,.04); }
        .ai-gap-item:last-child { border-bottom: 0; }
        .ai-gap-item[data-accepted="true"] { opacity: .55; }
        .ai-gap-text { flex: 1; margin: 0; color: rgba(255,255,255,.78); font-size: 13px; line-height: 1.5; }
        .ai-gap-accept { flex-shrink: 0; border: 1px solid rgba(194,122,53,.4); border-radius: 4px; background: none; padding: 3px 10px; color: #c27a35; font-size: 11px; cursor: pointer; white-space: nowrap; }
        .ai-gap-accept:hover { background: rgba(194,122,53,.1); }
        .ai-gap-done { flex-shrink: 0; color: rgba(100,220,120,.85); font-size: 11px; white-space: nowrap; }
        @media (max-width: 480px) { .ai-gap-item { flex-wrap: wrap; } .ai-gap-text { flex-basis: calc(100% - 24px); } .ai-gap-accept { margin-left: auto; } }
      `}</style>
    </section>
  )
}
