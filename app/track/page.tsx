// app/track/page.tsx — public project tracker. Clients enter their 6-digit Project ID.
import type { Metadata } from "next"
import Link from "next/link"
import { TrackerLookup } from "@/components/track/tracker-lookup"

export const metadata: Metadata = {
  title: "Track Your Project — NJENGA Productions Co.",
  description: "Enter your Project ID to see where your NJENGA Productions project stands.",
  robots: { index: false, follow: false },
}

export default function TrackPage() {
  return (
    <main className="flex min-h-screen flex-col bg-[#0f0f0f] text-white">
      <header className="px-6 py-6">
        <Link prefetch href="/" className="inline-block rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B15927]">
          <span className="block font-serif text-lg font-bold tracking-[0.14em] text-[#B15927]">NJENGA</span>
          <span className="block font-serif text-[9px] font-light tracking-[6px] text-white/50">PRODUCTIONS CO.</span>
        </Link>
      </header>

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
    </main>
  )
}
