// app/admin/page.tsx — brief list.
import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { isAdmin } from "@/auth"
import { countBriefs, listBriefs, listTrash } from "@/lib/briefs"
import { STATUSES, STATUS_LABEL, isStatus, type BriefStatus } from "@/lib/brief-status"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminBackdrop } from "@/components/admin/admin-backdrop"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Briefs — NJENGA Admin", robots: { index: false, follow: false } }

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" })

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  if (!(await isAdmin())) redirect("/admin/login")

  const { status: raw } = await searchParams
  const trash = raw === "trash"
  const status: BriefStatus = isStatus(raw) ? raw : "active"
  const [rows, counts] = await Promise.all([trash ? listTrash() : listBriefs(status), countBriefs()])

  return (
    <main className="relative isolate min-h-screen">
      <AdminBackdrop />
      <AdminHeader />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <nav aria-label="Brief status" className="mb-5 flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={`/admin?status=${s}`}
              aria-current={!trash && s === status ? "page" : undefined}
              className={`rounded-full border px-4 py-1.5 font-sans text-[13px] ${
                !trash && s === status ? "border-brand bg-accent font-semibold text-brand" : "border-input bg-surface text-muted-foreground"
              }`}
            >
              {STATUS_LABEL[s]} <span className="ml-1 text-[11px] opacity-70">{counts[s]}</span>
            </Link>
          ))}
          <Link
            href="/admin?status=trash"
            aria-current={trash ? "page" : undefined}
            className={`ml-auto rounded-full border px-4 py-1.5 font-sans text-[13px] ${
              trash ? "border-brand bg-accent font-semibold text-brand" : "border-white/20 bg-black/30 text-white/70"
            }`}
          >
            Trash <span className="ml-1 text-[11px] opacity-70">{counts.trash}</span>
          </Link>
        </nav>

        {rows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-hairline bg-surface/95 p-8 text-center font-sans text-sm text-muted-foreground">
            {trash ? "Trash is empty." : `No ${STATUS_LABEL[status].toLowerCase()} briefs yet.`}
            {!trash && status === "archived" && (
              <>
                {" "}
                <Link href="/admin/import" className="text-brand underline underline-offset-4">
                  Import past briefs
                </Link>
              </>
            )}
          </p>
        ) : (
          <ul className="space-y-2.5">
            {rows.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/admin/briefs/${b.id}`}
                  className="block rounded-lg border border-hairline bg-surface p-4 shadow-lg shadow-black/30 transition-colors hover:border-brand/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-serif text-[15px] font-bold text-foreground">{b.client_name}</p>
                      <p className="truncate font-sans text-[12px] text-muted-foreground">{b.client_email ?? "—"}</p>
                    </div>
                    <span className="flex-shrink-0 font-sans text-[11px] text-muted-foreground">
                      {b.deleted_at ? `Deleted ${fmtDate(b.deleted_at)}` : fmtDate(b.submitted_at)}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5 font-sans text-[11px]">
                    {b.budget && <span className="rounded-full bg-accent px-2 py-0.5 text-brand">{b.budget}</span>}
                    {b.meeting_type && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-foreground">
                        {b.meeting_type === "full" ? "Full 60" : "Quick 30"}
                      </span>
                    )}
                    <span className="rounded-full bg-muted px-2 py-0.5 text-foreground">
                      {b.gap_count} gap{b.gap_count === 1 ? "" : "s"}
                    </span>
                    {b.source === "import" && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">Imported</span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
