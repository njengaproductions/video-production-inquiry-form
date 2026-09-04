"use client"

import { useRef, useState } from "react"
import { extractBrief, type ExtractedBrief } from "@/app/actions/extract-brief"

type Status = "idle" | "reading" | "done" | "error"

export function ScopeUpload({ onExtracted }: { onExtracted: (data: ExtractedBrief) => void }) {
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
      setMessage("We pre-filled what we could — please review every field before continuing.")
    } else {
      setStatus("error")
      setMessage(result.error)
    }
  }

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
          {status === "reading" ? "Reading…" : "Upload"}
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
          {fileName && (
            <p className="mb-1 font-sans text-[11px] text-muted-foreground/70">{fileName}</p>
          )}
          {status === "reading" && (
            <p className="m-0 font-sans text-[12px] text-brand" role="status">
              Analyzing your document…
            </p>
          )}
          {message && (
            <p
              role={status === "error" ? "alert" : "status"}
              className={`m-0 font-sans text-[12px] leading-relaxed ${
                status === "error" ? "text-brand" : "text-green"
              }`}
            >
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
