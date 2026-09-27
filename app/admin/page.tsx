// app/admin/page.tsx — brief list (Phase 2). Detail view, status changes and import come in Phase 3–4.
import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { isAdmin, signOut } from "@/auth"
import { STATUSES, countBriefs, listBriefs, type BriefStatus } from "@/lib/briefs"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Briefs — NJENGA Admin", robots: { index: false, follow: false } }

const LABEL: Record<BriefStatus, string> = { active: "Active", closed: "Closed", archived: "Archived" }

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  })

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  if (!(await isAdmin())) redirect("/admin/login")

  const { status: raw } = await searchParams
  const status: BriefStatus = STATUSES.includes(raw as BriefStatus) ? (raw as BriefStatus) : "active"
  const [rows, counts] = await Promise.all([listBriefs(status), countBriefs()])

  return (
    <main className="min-h-screen bg-background">
      <header className="flex items-center justify-between bg-foreground px-6 py-4">
        <div>
          <div className="font-serif text-lg font-bold text-brand">NJENGA Productions Co.</div>
          <div className="mt-0.5 text-[11px] text-white/50">Client briefs</div>
        </div>
        <form
          action={async () => {
            "use server"
            await signOut({ redirectTo: "/admin/login" })
          }}
        >
          <button type="submit" className="font-sans text-[12px] text-white/60 underline-offset-4 hover:underline">
            Sign out
          </button>
        </form>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6">
        <nav aria-label="Brief status" className="mb-5 flex gap-2">
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={`/admin?status=${s}`}
              aria-current={s === status ? "page" : undefined}
              className={`rounded-full border px-4 py-1.5 font-sans text-[13px] ${
                s === status
                  ? "border-brand bg-accent font-semibold text-brand"
                  : "border-input bg-surface text-muted-foreground"
              }`}
            >
              {LABEL[s]} <span className="ml-1 text-[11px] opacity-70">{counts[s]}</span>
            </Link>
          ))}
        </nav>

        {rows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-hairline p-8 text-center font-sans text-sm text-muted-foreground">
            No {LABEL[status].toLowerCase()} briefs yet.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {rows.map((b) => (
              <li key={b.id} className="rounded-lg border border-hairline bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-serif text-[15px] font-bold text-foreground">{b.client_name}</p>
                    <p className="truncate font-sans text-[12px] text-muted-foreground">{b.client_email ?? "—"}</p>
                  </div>
                  <span className="flex-shrink-0 font-sans text-[11px] text-muted-foreground">
                    {fmtDate(b.submitted_at)}
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
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
