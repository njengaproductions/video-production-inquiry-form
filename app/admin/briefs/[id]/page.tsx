// app/admin/briefs/[id]/page.tsx — one brief: status, reply, pre-pro packet, notes, full brief.
import type { Metadata } from "next"
import type { ReactNode } from "react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { isAdmin } from "@/auth"
import { getBrief } from "@/lib/briefs"
import { toggleTrackerStage, setStageDate, setStageNote } from "@/app/admin/actions"
import { ShareTrackerButton } from "@/components/admin/share-tracker-button"
import { SECTIONS, display } from "@/lib/brief-rows"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminBackdrop } from "@/components/admin/admin-backdrop"
import { StatusControl } from "@/components/admin/status-control"
import { NotesEditor } from "@/components/admin/notes-editor"
import { DeleteControl } from "@/components/admin/delete-control"
import type { Gap } from "@/components/brief/gaps"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Brief — NJENGA Admin", robots: { index: false, follow: false } }

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  })

function GapList({ gaps, tone }: { gaps: Gap[]; tone: "critical" | "minor" }) {
  if (!gaps.length) return <p className="m-0 font-sans text-[13px] text-muted-foreground">None</p>
  return (
    <ul className="space-y-2">
      {gaps.map((g) => (
        <li
          key={g.id}
          className={`border-l-[3px] py-0.5 pl-3 ${tone === "critical" ? "border-brand" : "border-mauve"}`}
        >
          <span className="block font-sans text-[13px] font-semibold text-foreground">{g.agenda}</span>
          <span className="block font-sans text-[11px] text-muted-foreground">
            {g.label} · {g.source === "document" ? "from SOW" : "from form"}
          </span>
        </li>
      ))}
    </ul>
  )
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="lux-card rounded-lg border border-hairline bg-surface p-4 shadow-lg shadow-black/30">
      <h2 className="lux-eyebrow mb-3">{title}</h2>
      {children}
    </section>
  )
}

export default async function BriefPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) redirect("/admin/login")
  const { id } = await params
  const b = await getBrief(id)
  if (!b) notFound()

  const f = b.form
  const gaps = Array.isArray(b.gaps) ? b.gaps : []
  const critical = gaps.filter((g) => g.severity === "critical")
  const minor = gaps.filter((g) => g.severity === "minor")
  const clientEmail = b.client_email ?? (typeof f?.email === "string" ? f.email : null)
  const reply = clientEmail
    ? `mailto:${clientEmail}?subject=${encodeURIComponent("Re: Your project brief — NJENGA Productions Co.")}`
    : null

  return (
    <main className="relative isolate min-h-screen">
      <AdminBackdrop />
      <AdminHeader subtitle="Brief" />
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-12 sm:py-20">
        <Link prefetch href={b.deleted_at ? "/admin?status=trash" : `/admin?status=${b.status}`} className="font-sans text-[12px] text-white/70 underline-offset-4 hover:underline">
          ← All briefs
        </Link>

        {b.deleted_at && <DeleteControl id={b.id} name={b.client_name} deletedAt={b.deleted_at} status={b.status} />}

        <section className="lux-card rounded-lg border border-hairline bg-surface p-4 shadow-lg shadow-black/30">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="lux-headline m-0 text-foreground">{b.client_name}</h1>
              <p className="m-0 font-sans text-[12px] text-muted-foreground">
                {fmtDate(b.submitted_at)}
                {b.source === "import" ? " · Imported" : ""}
              </p>
            </div>
            {reply && (
              <a
                href={reply}
                className="flex-shrink-0 rounded-md bg-brand px-4 py-2 font-sans text-[12px] font-semibold text-primary-foreground"
              >
                Reply
              </a>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-sans text-[13px]">
            {clientEmail && (
              <a href={`mailto:${clientEmail}`} className="text-brand underline-offset-4 hover:underline">
                {clientEmail}
              </a>
            )}
            {f.phone && (
              <a href={`tel:${f.phone.replace(/[^\d+]/g, "")}`} className="text-brand underline-offset-4 hover:underline">
                {f.phone}
              </a>
            )}
            {f.contactMethod && <span className="text-muted-foreground">Prefers {f.contactMethod.toLowerCase()}</span>}
          </div>
          {!b.deleted_at && (
            <div className="mt-4">
              <StatusControl id={b.id} status={b.status} />
            </div>
          )}
        </section>

        <Card title="Pre-pro packet">
          <p className="m-0 font-sans text-[14px] font-semibold text-foreground">
            {b.meeting ? `${b.meeting.type === "full" ? "Full" : "Quick"} meeting · ${b.meeting.minutes} min` : "No meeting plan"}
          </p>
          <p className="mt-1 mb-0 font-sans text-[13px] text-muted-foreground">
            Draft range: {b.quote ?? b.budget ?? "—"}
          </p>
          {b.meeting?.bringApprover && (
            <p className="mt-3 mb-0 rounded-md bg-accent p-2.5 font-sans text-[12px] font-semibold text-brand">
              Not the decision maker — get the approver on the call.
            </p>
          )}
          <h3 className="mt-4 mb-2 font-sans text-[11px] font-bold uppercase text-muted-foreground">Must resolve</h3>
          <GapList gaps={critical} tone="critical" />
          <h3 className="mt-4 mb-2 font-sans text-[11px] font-bold uppercase text-muted-foreground">Clarify if time</h3>
          <GapList gaps={minor} tone="minor" />
        </Card>

        <Card title="Private notes">
          <NotesEditor id={b.id} initial={b.notes ?? ""} />
        </Card>

        {b.tracker_id && (
          <section className="lux-card rounded-lg border border-hairline bg-surface p-4 shadow-lg shadow-black/30">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="lux-eyebrow m-0">Project Tracker</h2>
              <span className="font-sans text-[11px] text-muted-foreground">njengapro.co/track · Share this ID with the client</span>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="m-0 font-mono text-3xl font-bold tracking-[0.2em] text-foreground">{b.tracker_id}</p>
                <ShareTrackerButton briefId={b.id} clientEmail={clientEmail} />
              </div>
              <div className="text-right font-sans text-[12px] text-muted-foreground">
                <p className="m-0">Views: {b.tracker_access_count ?? 0}</p>
                <p className="m-0">Last viewed: {b.tracker_last_viewed ? fmtDate(b.tracker_last_viewed) : "Never"}</p>
              </div>
            </div>
            {Array.isArray(b.tracker_stages) && b.tracker_stages.length > 0 && (
              <ul className="mt-4 space-y-1.5">
                {b.tracker_stages.map((s, i) => (
                  <li key={s.key} className={`rounded-xl border transition-colors ${s.done ? "border-brand/25 bg-brand/[0.04]" : "border-border bg-surface"}`}>
                    <div className="flex items-center gap-3 px-3 py-2.5">
                      <form action={async () => {
                        "use server"
                        await toggleTrackerStage(b.id, i, !s.done)
                      }}>
                        <button
                          type="submit"
                          aria-label={`${s.done ? "Mark incomplete" : "Mark complete"}: ${s.label}`}
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${s.done ? "border-brand bg-brand text-white" : "border-border bg-surface hover:border-brand/60"}`}
                        >
                          {s.done && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                          )}
                        </button>
                      </form>

                      <span className={`flex-1 font-sans text-[13px] font-medium ${s.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                        {s.label}
                      </span>

                      {s.note && (
                        <span className={`rounded px-1.5 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-wide ${s.noteVisible ? "bg-accent text-brand" : "bg-muted text-muted-foreground"}`}>
                          {s.noteVisible ? "Client note" : "Note"}
                        </span>
                      )}

                      <form
                        action={async (fd: FormData) => {
                          "use server"
                          const date = String(fd.get("date") ?? "").trim()
                          await setStageDate(b.id, i, /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null)
                        }}
                        className="flex items-center gap-1"
                      >
                        <input
                          type="date"
                          name="date"
                          defaultValue={s.date ?? ""}
                          aria-label={`Date for ${s.label}`}
                          className="h-6 rounded-md border border-border bg-muted px-1.5 font-sans text-[11px] text-foreground [color-scheme:dark] outline-none focus:border-brand"
                        />
                        <button type="submit" className="h-6 rounded-md border border-border bg-muted px-2 font-sans text-[11px] text-muted-foreground transition-colors hover:border-brand hover:text-brand">
                          Set
                        </button>
                      </form>
                    </div>

                    <form
                      action={async (fd: FormData) => {
                        "use server"
                        await setStageNote(b.id, i, String(fd.get("note") ?? "").slice(0, 280), fd.get("visible") === "on")
                      }}
                      className="border-t border-border/40 px-3 pb-3 pt-2.5"
                    >
                      <textarea
                        name="note"
                        defaultValue={s.note ?? ""}
                        rows={2}
                        maxLength={280}
                        placeholder="Add a stage note…"
                        aria-label={`Note for ${s.label}`}
                        className="w-full resize-none rounded-md border border-border bg-muted/60 px-2.5 py-1.5 font-sans text-[12px] text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-brand focus:bg-surface"
                      />
                      <div className="mt-2 flex items-center justify-between">
                        <label className="flex cursor-pointer items-center gap-2 font-sans text-[11px] text-muted-foreground">
                          <input type="checkbox" name="visible" defaultChecked={s.noteVisible ?? false} className="h-3 w-3 accent-[var(--brand)]" />
                          Visible to client
                        </label>
                        <button type="submit" className="rounded-md bg-brand px-3 py-1 font-sans text-[11px] font-semibold text-white transition-opacity hover:opacity-90">
                          Save
                        </button>
                      </div>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {SECTIONS.map((s) => (
          <Card key={s.title} title={s.title}>
            <dl className="m-0 space-y-2.5">
              {s.rows.map((r) => (
                <div key={r.label} className="grid grid-cols-1 gap-0.5 sm:grid-cols-[180px_1fr] sm:gap-3">
                  <dt className="font-sans text-[12px] font-semibold text-muted-foreground">{r.label}</dt>
                  <dd className="m-0 whitespace-pre-wrap font-sans text-[13px] text-foreground">{display(f, r.key)}</dd>
                </div>
              ))}
            </dl>
          </Card>
        ))}

        {!b.deleted_at && <DeleteControl id={b.id} name={b.client_name} deletedAt={null} status={b.status} />}
      </div>
    </main>
  )
}
