"use client"

import { useRef, useState } from "react"
import { extractBrief, type ExtractedBrief } from "@/app/actions/extract-brief"

type Status = "idle" | "reading" | "done" | "error"

export type UploadSummary = {
  filled: number // fields pre-filled from the document
  remaining: number // required fields on this step still empty
}

export function ScopeUpload({
  onExtracted,
  summary,
  onShowMe,
}: {
  onExtracted: (data: ExtractedBrief) => void
  summary: UploadSummary | null
  onShowMe: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<Status>("idle")
  const [fileName, setFileName] = useState("")
  const [message, setMessage] = useState("")

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setFileName(file.name)
    setStatus("reading")
    setMessage("")
    const fd = new FormData()
    fd.append("file", file)
    const result = await extractBrief(fd)
    if (result.ok) {
      onExtracted(result.data)
      setStatus("done")
    } else {
      setStatus("error")
      setMessage(result.error)
    }
    // Allow re-uploading the same file.
    if (inputRef.current) inputRef.current.value = ""
  }

  const allSet = summary !== null && summary.remaining === 0
  const nothingFound = summary !== null && summary.filled === 0

  return (
    <div className="mb-6 rounded-lg border border-dashed border-brand/50 bg-accent p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="mb-0.5 font-serif text-[13px] font-bold text-brand">Have a scope of work? Skip the typing.</p>
          <p className="m-0 font-sans text-xs leading-relaxed text-muted-foreground">
            Upload a PDF, Word, or text document and we&apos;ll auto-fill the brief for you to review.
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={status === "reading"}
          className="flex-shrink-0 rounded-md bg-brand px-4 py-2 font-sans text-[12px] font-semibold text-primary-foreground transition-colors disabled:cursor-default disabled:bg-input"
        >
          {status === "reading" ? "Reading…" : status === "done" ? "Replace" : "Upload"}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {status !== "idle" && (
        <div className="mt-3 border-t border-brand-border pt-3">
          {fileName && <p className="mb-2 font-sans text-[11px] text-muted-foreground/70">{fileName}</p>}

          {status === "reading" && (
            <p className="m-0 flex items-center gap-2 font-sans text-[12px] text-brand" role="status">
              <span
                aria-hidden
                className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand/30 border-t-brand"
              />
              Reading your document and filling what we can…
            </p>
          )}

          {status === "error" && (
            <p role="alert" className="m-0 font-sans text-[12px] leading-relaxed text-brand">
              {message}
            </p>
          )}

          {status === "done" && summary && (
            <div
              role="status"
              aria-live="polite"
              className="brief-badge-in flex items-center gap-3 rounded-md border border-green/40 bg-green-bg p-3"
            >
              <span
                aria-hidden
                className="brief-pop flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green text-white"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-sans text-[13px] font-semibold text-green">
                  {nothingFound
                    ? "Document read — nothing we could fill"
                    : `Document read — ${summary.filled} field${summary.filled === 1 ? "" : "s"} filled`}
                </span>
                <span className="block font-sans text-[12px] leading-relaxed text-muted-foreground">
                  {allSet
                    ? "All required details on this page are in. Please check what we filled."
                    : `${summary.remaining} required field${summary.remaining === 1 ? "" : "s"} still needed. Please check what we filled.`}
                </span>
              </span>
              {!allSet && (
                <button
                  type="button"
                  onClick={onShowMe}
                  className="flex-shrink-0 rounded-md border border-green/50 bg-surface px-3 py-1.5 font-sans text-[12px] font-semibold text-green"
                >
                  Show me
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
