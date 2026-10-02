"use client"

import { useRef, useState } from "react"
import { setVoiceStatus, uploadVoiceLogo } from "@/app/admin/voices/actions"
import type { Voice } from "@/lib/voices"

export function VoiceReviewCard({ voice }: { voice: Voice }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)
  const date = new Date(voice.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" })

  async function upload(file: File) {
    setBusy(true)
    setMessage("")
    const result = await uploadVoiceLogo(voice.id, file)
    setMessage(result.ok ? "Logo uploaded." : result.error)
    setBusy(false)
  }

  async function changeStatus(status: "approved" | "rejected") {
    setBusy(true)
    setMessage("")
    const result = await setVoiceStatus(voice.id, status)
    if (!result.ok) setMessage(result.error)
    setBusy(false)
  }

  return (
    <article className="rounded-lg border border-white/10 bg-surface p-7 shadow-lg shadow-black/20">
      <blockquote className="border-l-2 border-brand pl-4 font-serif text-lg italic text-white/90">&ldquo;{voice.quote}&rdquo;</blockquote>
      <div className="mt-5 flex items-center gap-3">
        {voice.logo_url ? <img src={voice.logo_url} alt={`${voice.company || voice.name} logo`} className="h-10 w-10 rounded bg-white object-contain p-1" /> : <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-xs font-semibold text-foreground">{voice.name.split(" ").map((word) => word[0]).join("").slice(0, 2)}</div>}
        <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><p className="truncate text-sm font-medium">{voice.name || "Anonymous"}</p><p className="shrink-0 text-right text-xs text-muted-foreground">{date}</p></div><p className="text-xs text-white/50">{voice.company || "No company provided"}{voice.role ? ` · ${voice.role}` : ""}</p></div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">{voice.words.map((word) => <span key={word} className="rounded-full bg-brand px-2.5 py-1 text-[10px] font-medium text-foreground">{word}</span>)}</div>
      </div>
      <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className="mt-5 flex min-h-20 w-full items-center justify-center rounded-lg border border-dashed border-white/20 bg-black/10 p-4 text-xs text-white/50 hover:border-brand hover:text-white disabled:opacity-50">
        {voice.logo_url ? <img src={voice.logo_url} alt="Uploaded company logo" className="h-12 max-w-40 object-contain" /> : "Click to upload a company logo (optional)"}
      </button>
      <div className="mt-5 flex flex-wrap gap-2">
        <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); event.currentTarget.value = "" }} />
        <button type="button" disabled={busy} onClick={() => void changeStatus("approved")} className="rounded bg-brand px-3 py-2 text-xs font-semibold text-foreground hover:brightness-110 disabled:opacity-50">Approve</button>
        <button type="button" disabled={busy} onClick={() => void changeStatus("rejected")} className="rounded border border-red-300/30 px-3 py-2 text-xs text-red-200 hover:border-red-300 disabled:opacity-50">Reject</button>
      </div>
      {message && <p className="mt-3 text-xs text-white/60" role="status">{message}</p>}
    </article>
  )
}
