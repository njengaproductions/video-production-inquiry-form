import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { isAdmin } from "@/auth"
import { AdminBackdrop } from "@/components/admin/admin-backdrop"
import { AdminHeader } from "@/components/admin/admin-header"
import { VoiceReviewCard } from "@/components/admin/voice-review-card"
import { listPendingVoices, type Voice } from "@/lib/voices"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Voices — NJENGA Admin", robots: { index: false, follow: false } }

export default async function AdminVoicesPage() {
  if (!(await isAdmin())) redirect("/admin/login")
  const voices = await listPendingVoices()

  return (
    <main className="relative isolate min-h-screen">
      <AdminBackdrop />
      <AdminHeader subtitle="Voice submissions" />
      <div className="relative mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div><p className="text-xs uppercase tracking-[0.22em] text-brand">Review queue</p><h1 className="mt-2 font-serif text-3xl text-white">Voices</h1></div>
          <p className="text-sm text-white/50">{voices.length} pending</p>
        </div>
        {voices.length === 0 ? <p className="rounded-lg border border-white/10 bg-surface p-10 text-center font-serif italic text-white/60">No pending voice submissions.</p> : <div className="grid gap-5 md:grid-cols-2">{voices.map((voice: Voice) => <VoiceReviewCard key={voice.id} voice={voice} />)}</div>}
      </div>
    </main>
  )
}
