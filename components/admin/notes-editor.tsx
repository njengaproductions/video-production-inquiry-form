"use client"

// components/admin/notes-editor.tsx — private notes, visible only in the back office.
import { useState, useTransition } from "react"
import { saveNotes } from "@/app/admin/actions"

export function NotesEditor({ id, initial }: { id: string; initial: string }) {
  const [value, setValue] = useState(initial)
  const [saved, setSaved] = useState(initial)
  const [msg, setMsg] = useState("")
  const [busy, startTransition] = useTransition()
  const dirty = value !== saved

  const save = () =>
    startTransition(async () => {
      const r = await saveNotes(id, value)
      if (r.ok) {
        setSaved(value)
        setMsg("Saved ✓")
      } else {
        setMsg(r.error)
      }
    })

  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          setMsg("")
        }}
        rows={5}
        placeholder="Private notes — only you can see these."
        className="w-full resize-y rounded-md border border-input bg-field px-3.5 py-2.5 font-sans text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="font-sans text-[12px] text-muted-foreground" aria-live="polite">
          {msg || (dirty ? "Unsaved changes" : "")}
        </span>
        <button
          type="button"
          onClick={save}
          disabled={!dirty || busy}
          className="rounded-md bg-brand px-4 py-1.5 font-sans text-[12px] font-semibold text-primary-foreground disabled:cursor-default disabled:bg-input"
        >
          {busy ? "Saving…" : "Save notes"}
        </button>
      </div>
    </div>
  )
}
