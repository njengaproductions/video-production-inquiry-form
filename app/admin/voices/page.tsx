import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { isAdmin } from "@/auth"
import { AdminBackdrop } from "@/components/admin/admin-backdrop"
import { AdminHeader } from "@/components/admin/admin-header"
import { VoiceReviewCard } from "@/components/admin/voice-review-card"
import { listVoicesByStatus, type Voice } from "@/lib/voices"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Voices — NJENGA Admin", robots: { index: false, follow: false } }

type Tab = "pending" | "approved"

export default async function AdminVoicesPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  if (!(await isAdmin())) redirect("/admin/login")
  const tab: Tab = (await searchParams).tab === "approved" ? "approved" : "pending"
  const voices = await listVoicesByStatus(tab)

  return (
    <main className="relative isolate min-h-screen text-primary">
      <AdminBackdrop />
      <AdminHeader subtitle="Voice submissions" />
      <div className="relative mx-auto max-w-5xl px-4 py-8">
        <Link prefetch href="/admin" className="mb-5 inline-flex text-sm text-muted hover:text-primary">← Back to admin</Link>
        <div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.22em] text-brand-light">Review queue</p><h1 className="mt-2 font-serif text-3xl text-primary">Voices</h1></div><p className="text-sm text-secondary">{voices.length} {tab}</p></div>
        <nav aria-label="Voice review tabs" className="mb-6 flex gap-2 border-b border-border/30"><Link prefetch href="/admin/voices?tab=pending" aria-current={tab === "pending" ? "page" : undefined} className={`border-b-2 px-3 py-3 text-sm ${tab === "pending" ? "border-brand font-medium text-surface" : "border-transparent text-secondary/80 hover:text-surface"}`}>Pending</Link><Link prefetch href="/admin/voices?tab=approved" aria-current={tab === "approved" ? "page" : undefined} className={`border-b-2 px-3 py-3 text-sm ${tab === "approved" ? "border-brand font-medium text-surface" : "border-transparent text-secondary/80 hover:text-surface"}`}>Approved</Link></nav>
        {voices.length === 0 ? <p className="rounded-lg border border-border bg-surface p-10 text-center font-serif italic text-text-secondary">{tab === "pending" ? "No pending voices. You're all caught up." : "No approved voices yet."}</p> : <div className="grid gap-5 md:grid-cols-2">{voices.map((voice: Voice) => <VoiceReviewCard key={voice.id} voice={voice} approved={tab === "approved"} />)}</div>}
      </div>
    </main>
  )
}
