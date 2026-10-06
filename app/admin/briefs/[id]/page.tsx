// app/admin/briefs/[id]/page.tsx — one brief: status, reply, pre-pro packet, notes, full brief.
import type { Metadata } from "next"
import type { ReactNode } from "react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { isAdmin } from "@/auth"
import { getBrief } from "@/lib/briefs"
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
  const reply = b.client_email
    ? `mailto:${b.client_email}?subject=${encodeURIComponent("Re: Your project brief — NJENGA Productions Co.")}`
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
            {b.client_email && (
              <a href={`mailto:${b.client_email}`} className="text-brand underline-offset-4 hover:underline">
                {b.client_email}
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
