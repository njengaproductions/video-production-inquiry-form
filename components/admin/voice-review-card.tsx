"use client"

import { useRef, useState } from "react"
import { deleteVoiceLogo, saveVoiceNote, saveVoiceQuote, setVoiceStatus, uploadVoiceLogo } from "@/app/admin/voices/actions"
import type { Voice } from "@/lib/voices"

export function VoiceReviewCard({ voice, approved = false }: { voice: Voice; approved?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const [quote, setQuote] = useState(voice.quote)
  const [note, setNote] = useState(voice.internal_note)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const date = new Date(voice.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" })

  async function run(action: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    setBusy(true); setMessage(""); const result = await action(); setMessage(result.ok ? success : result.error ?? "Something went wrong."); setBusy(false)
  }

  return (
    <article className="rounded-lg border border-border bg-surface p-7 shadow-lg shadow-black/10">
      <div className="flex items-start justify-between gap-3">
        {editing ? <textarea value={quote} onChange={(event) => setQuote(event.target.value)} className="min-h-24 flex-1 rounded border border-border bg-background p-3 font-serif text-lg italic text-primary outline-none focus:border-brand" /> : <blockquote className="flex-1 border-l-2 border-brand pl-4 font-serif text-lg italic text-primary">&ldquo;{voice.quote}&rdquo;</blockquote>}
        {!approved && <button type="button" aria-label="Edit quote" onClick={() => setEditing(true)} className="text-sm text-muted hover:text-primary">✎</button>}
      </div>
      {editing && <div className="mt-3 flex gap-2"><button type="button" disabled={busy} onClick={() => void run(() => saveVoiceQuote(voice.id, quote), "Quote saved.").then(() => setEditing(false))} className="rounded bg-brand px-3 py-2 text-xs font-semibold text-foreground">Save</button><button type="button" onClick={() => { setQuote(voice.quote); setEditing(false) }} className="rounded border border-border px-3 py-2 text-xs text-secondary">Cancel</button></div>}
      <div className="mt-5 flex items-center gap-3">
        {voice.logo_url ? <div className="relative h-10 w-10 rounded bg-background"><img src={voice.logo_url} alt={`${voice.company || voice.name} logo`} className="h-10 w-10 rounded object-contain" /><button type="button" aria-label="Delete logo" disabled={busy} onClick={() => void run(() => deleteVoiceLogo(voice.id, voice.logo_url!), "Logo removed.")} className="absolute -right-2 -top-2 rounded-full border border-border bg-surface p-1 text-secondary hover:text-primary"><svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7l1-3h4l1 3" /></svg></button></div> : <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-xs font-semibold text-foreground">{voice.name.split(" ").map((word) => word[0]).join("").slice(0, 2)}</div>}
        <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><p className="truncate text-sm font-medium text-primary">{voice.name || "Anonymous"}</p><div className="flex items-center gap-2">{approved && <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold text-emerald-600">Approved</span>}<p className="shrink-0 text-right text-xs text-muted">{date}</p></div></div><p className="text-xs text-secondary">{voice.company || "No company provided"}{voice.role ? ` · ${voice.role}` : ""}</p></div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">{voice.words.map((word) => <span key={word} className="rounded-full bg-brand px-2.5 py-1 text-[10px] font-medium text-foreground">{word}</span>)}</div>
      {!voice.logo_url && <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className="mt-5 flex min-h-20 w-full items-center justify-center rounded-lg border border-dashed border-border bg-background p-4 text-xs text-muted hover:border-brand hover:text-primary">Click to upload a company logo (optional)</button>}
      <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void run(() => uploadVoiceLogo(voice.id, file), "Logo uploaded."); event.currentTarget.value = "" }} />
      {!approved && <>
        <label className="mt-5 block text-xs text-secondary">Internal note<textarea value={note} onChange={(event) => setNote(event.target.value)} onBlur={() => void saveVoiceNote(voice.id, note)} placeholder="Only visible to admins" className="mt-2 min-h-16 w-full rounded border border-border bg-background p-3 text-sm text-primary outline-none focus:border-brand" /></label>
        <div className="mt-5 flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={() => void run(() => setVoiceStatus(voice.id, "approved"), "Voice approved.")} className="rounded bg-brand px-3 py-2 text-xs font-semibold text-foreground">Approve</button><button type="button" disabled={busy} onClick={() => void run(() => setVoiceStatus(voice.id, "rejected"), "Voice rejected.")} className="rounded border border-border px-3 py-2 text-xs text-secondary">Reject</button></div>
      </>}
      {approved && <div className="mt-5">{confirmRemove ? <div className="rounded border border-border bg-background p-3 text-sm text-primary">Are you sure? This will remove this voice from the public page.<div className="mt-3 flex gap-2"><button type="button" disabled={busy} onClick={() => void run(() => setVoiceStatus(voice.id, "rejected"), "Voice removed.").then(() => setConfirmRemove(false))} className="rounded bg-brand px-3 py-2 text-xs font-semibold text-foreground">Confirm</button><button type="button" onClick={() => setConfirmRemove(false)} className="rounded border border-border px-3 py-2 text-xs text-secondary">Cancel</button></div></div> : <button type="button" disabled={busy} onClick={() => setConfirmRemove(true)} className="text-xs text-muted underline-offset-4 hover:text-primary hover:underline">Remove from Voices</button>}</div>}
      {message && <p className="mt-3 text-xs text-secondary" role="status">{message}</p>}
    </article>
  )
}
