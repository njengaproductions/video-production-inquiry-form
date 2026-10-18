// app/track/page.tsx — public project tracker. Clients enter their 6-digit Project ID.
import type { Metadata } from "next"
import Link from "next/link"
import { TrackerLookup } from "@/components/track/tracker-lookup"
import { isAdmin } from "@/auth"
import { AdminHeader } from "@/components/admin/admin-header"

export const metadata: Metadata = {
  title: "Track Your Project — NJENGA Productions Co.",
  description: "Enter your Project ID to see where your NJENGA Productions project stands.",
  robots: { index: false, follow: false },
}

export default async function TrackPage() {
  const admin = await isAdmin()
  return (
    <main className="relative flex min-h-screen flex-col text-white" style={{ backgroundColor: "#121110", backgroundImage: "url('/images/admin-bg.webp')", backgroundSize: "cover", backgroundPosition: "right" }}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 to-black/50" />
      <div className="relative z-10 flex flex-1 flex-col">
        {admin ? (
          <AdminHeader subtitle="Project Tracker" />
        ) : (
          <header className="flex items-center justify-between px-6 py-5">
            <Link prefetch href="/" className="inline-block rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B15927]">
              <span className="block font-serif text-lg font-bold tracking-[0.14em] text-[#B15927]">NJENGA</span>
              <span className="block font-serif text-[9px] font-light tracking-[6px] text-white/50">PRODUCTIONS CO.</span>
            </Link>
            <Link prefetch href="/" className="flex items-center gap-1.5 rounded-md px-3 py-2 font-sans text-[12px] text-white/50 transition-colors hover:text-white/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B15927]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
              Back to site
            </Link>
          </header>
        )}
        <div className="mx-auto w-full max-w-xl flex-1 px-6 pt-8 pb-16 sm:pt-16">
          <h1 className="m-0 font-serif text-3xl font-semibold text-balance sm:text-4xl">Track your project</h1>
          <p className="mt-2 mb-8 font-sans text-sm text-white/60 text-pretty">
            Enter the 6-digit Project ID we shared with you to see where things stand.
          </p>
          <TrackerLookup />
        </div>
        <footer className="px-6 py-8 text-center font-sans text-[12px] text-white/40">
          Questions? Email{" "}
          <a href="mailto:hello@njengapro.co" className="text-white/70 underline-offset-4 hover:underline">
            hello@njengapro.co
          </a>
        </footer>
      </div>
    </main>
  )
}
