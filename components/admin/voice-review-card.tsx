"use client"

import { useRef, useState } from "react"
import { deleteVoiceLogo, saveVoiceNote, saveVoiceQuote, setVoiceStatus, uploadVoiceLogo } from "@/app/admin/voices/actions"
import { logoImageStyle } from "@/lib/logo-display"
import type { Voice } from "@/lib/voices"
import { LogoDisplayControls } from "./logo-display-controls"

const primaryButton = "rounded bg-brand px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-brand/90 disabled:opacity-60"
const secondaryButton = "rounded border border-brand-border px-3 py-2 text-xs font-medium text-foreground hover:bg-background"

function TrashIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7l1-3h4l1 3" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

export function VoiceReviewCard({ voice, approved = false }: { voice: Voice; approved?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const [quote, setQuote] = useState(voice.quote)
  const [note, setNote] = useState(voice.internal_note)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const date = new Date(voice.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" })
  const company = voice.company?.trim()
  const role = voice.role?.trim()
  const affiliation = [company, role].filter(Boolean).join(" · ")
  const initials = voice.name.split(" ").map((word) => word[0]).join("").slice(0, 2)
  const showUploadZone = true

  async function run(action: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    setBusy(true); setMessage(""); const result = await action(); setMessage(result.ok ? success : result.error ?? "Something went wrong."); setBusy(false)
  }

  return (
    <article className="lux-card relative w-full max-w-[560px] rounded-lg border border-border bg-surface p-7 shadow-lg shadow-black/10">
      {voice.logo_url && (
        <button type="button" aria-label="Delete logo" disabled={busy} onClick={() => void run(() => deleteVoiceLogo(voice.id, voice.logo_url!), "Logo removed.")} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-background hover:text-destructive disabled:opacity-60">
          <TrashIcon />
        </button>
      )}

      {editing ? (
        <div>
          <label htmlFor={`quote-${voice.id}`} className="sr-only">Edit quote</label>
          <textarea id={`quote-${voice.id}`} value={quote} onChange={(event) => setQuote(event.target.value)} rows={3} className="w-full rounded border border-brand-border bg-background p-3 font-serif text-lg italic text-primary outline-none focus:border-brand" />
          <div className="mt-3 flex gap-2">
            <button type="button" disabled={busy} onClick={() => void run(() => saveVoiceQuote(voice.id, quote), "Quote saved.").then(() => setEditing(false))} className={primaryButton}>Save</button>
            <button type="button" onClick={() => { setQuote(voice.quote); setEditing(false) }} className={secondaryButton}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2">
          <blockquote className="flex-1 border-l-2 border-brand pl-4 font-serif text-lg italic text-primary">&ldquo;{quote}&rdquo;</blockquote>
          {!approved && (
            <button type="button" aria-label="Edit quote" onClick={() => setEditing(true)} className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-background hover:text-primary">
              <PencilIcon />
            </button>
          )}
        </div>
      )}

      <div className="mt-5 flex items-center gap-3">
        {voice.logo_url ? (
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#0a0806]">
            <img src={voice.logo_url} alt={`${company || voice.name} logo`} className="size-full" style={logoImageStyle(voice.logo_display)} />
          </div>
        ) : (
          <div aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-primary-foreground">{initials}</div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm font-medium text-primary">{voice.name || "Anonymous"}</p>
            <div className="flex shrink-0 items-center gap-2">
              {approved && <span className="rounded-full bg-green-bg px-2 py-1 text-[10px] font-semibold text-green">Approved</span>}
              <p className="text-xs text-muted-foreground">{date}</p>
            </div>
          </div>
          {affiliation && <p className="truncate text-xs text-muted-foreground">{affiliation}</p>}
        </div>
      </div>

      {voice.logo_url && (
        <LogoDisplayControls key={voice.logo_url} voiceId={voice.id} logoUrl={voice.logo_url} alt={`${company || voice.name} logo`} initial={voice.logo_display} />
      )}

      {voice.words.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Words">
          {voice.words.map((word) => <li key={word} className="rounded-full bg-brand-light px-2.5 py-1 text-[11px] font-medium text-brand-strong">{word}</li>)}
        </ul>
      )}

      {showUploadZone && (
        <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className="mt-5 flex min-h-16 w-full items-center justify-center rounded-lg border border-dashed border-brand-border bg-background p-4 text-xs text-muted-foreground hover:border-brand hover:text-primary disabled:opacity-60">
          {voice.logo_url ? "Click to replace the company logo" : "Click to upload a company logo (optional)"}
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(event) => { const file = event.target.files?.[0]; if (file) void run(() => uploadVoiceLogo(voice.id, file), "Logo uploaded."); event.currentTarget.value = "" }} />

      {!approved && (
        <>
          <label className="mt-5 block text-xs font-medium text-primary">
            Internal note
            <textarea value={note} onChange={(event) => setNote(event.target.value)} onBlur={() => void saveVoiceNote(voice.id, note)} rows={2} placeholder="Only visible to admins" className="mt-2 w-full resize-none rounded border border-brand-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-brand" />
          </label>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => void run(() => setVoiceStatus(voice.id, "approved"), "Voice approved.")} className={primaryButton}>Approve</button>
            <button type="button" disabled={busy} onClick={() => void run(() => setVoiceStatus(voice.id, "rejected"), "Voice rejected.")} className="rounded border border-border-danger bg-surface px-3 py-2 text-xs font-semibold text-border-danger hover:bg-background disabled:opacity-60">Reject</button>
          </div>
        </>
      )}

      {approved && (
        <div className="mt-5">
          {confirmRemove ? (
            <div className="rounded border border-border bg-background p-3 text-sm text-foreground">
              Are you sure? This will remove this voice from the public page.
              <div className="mt-3 flex gap-2">
                <button type="button" disabled={busy} onClick={() => void run(() => setVoiceStatus(voice.id, "rejected"), "Voice removed.").then(() => setConfirmRemove(false))} className={primaryButton}>Confirm</button>
                <button type="button" onClick={() => setConfirmRemove(false)} className={secondaryButton}>Cancel</button>
              </div>
            </div>
          ) : (
            <button type="button" disabled={busy} onClick={() => setConfirmRemove(true)} className="text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline">Remove from Voices</button>
          )}
        </div>
      )}
      {message && <p className="mt-3 text-xs text-muted-foreground" role="status">{message}</p>}
    </article>
  )
}
