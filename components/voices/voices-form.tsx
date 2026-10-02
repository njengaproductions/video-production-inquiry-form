"use client"

import Link from "next/link"
import { useState } from "react"
import { submitVoice } from "@/app/actions/submit-voice"

const WORDS = ["Cinematic", "Showed up", "Exceeded expectations", "Changed the game", "Professional", "Creative", "Fast turnaround", "On brand", "Storytelling", "Legendary", "Detail-oriented", "Easy to work with"]

export type ApprovedVoice = {
  id: string
  name: string
  company: string
  quote: string
  words: string[]
  logo_url: string | null
}

function TestimonialCard({
  testimonial,
  index,
}: {
  testimonial: ApprovedVoice
  index: number
}) {
  return (
    <article className={`w-[min(22rem,calc(100vw-3rem))] flex-shrink-0 border-l-2 ${index % 2 === 0 ? "border-brand" : "border-mauve"} bg-white/[0.04] p-5`}>
      <p className="font-serif text-lg italic leading-relaxed text-white/90">&ldquo;{testimonial.quote}&rdquo;</p>
      <div className="mt-5 flex items-center gap-3">
        {testimonial.logo_url ? <img src={testimonial.logo_url} alt={`${testimonial.company || testimonial.name} logo`} className="h-9 w-9 rounded bg-white object-contain p-1" /> : <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-xs font-semibold text-foreground">{testimonial.name.split(" ").map((word) => word[0]).join("").slice(0, 2)}</div>}
        <div>
          <p className="text-sm font-medium">{testimonial.name}</p>
          <p className="text-xs text-white/50">{testimonial.company}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {testimonial.words.map((tag) => <span key={tag} className="rounded-full bg-brand px-2.5 py-1 text-[10px] font-medium text-foreground">{tag}</span>)}
      </div>
    </article>
  )
}

function Testimonials({ testimonials }: { testimonials: ApprovedVoice[] }) {
  if (testimonials.length === 0) {
    return <p className="py-16 text-center font-serif text-lg italic text-muted">No voices yet. Be the first to share yours.</p>
  }

  if (testimonials.length === 1) {
    return <div className="flex justify-center"><TestimonialCard testimonial={testimonials[0]} index={0} /></div>
  }

  return (
    <div className="overflow-hidden">
      <div className="voices-marquee flex w-max gap-4 hover:[animation-play-state:paused]">
        {[...testimonials, ...testimonials].map((testimonial, index) => (
          <TestimonialCard key={`${testimonial.id}-${index}`} testimonial={testimonial} index={index % testimonials.length} />
        ))}
      </div>
      <p className="mt-5 text-center text-xs text-muted">{testimonials.length} voices and counting.</p>
    </div>
  )
}

export function VoicesForm({ testimonials }: { testimonials: ApprovedVoice[] }) {
  const [selected, setSelected] = useState<string[]>([])
  const [quote, setQuote] = useState("")
  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle")
  const [error, setError] = useState("")

  const toggle = (word: string) => setSelected((current) => current.includes(word) ? current.filter((item) => item !== word) : [...current, word])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!quote.trim()) return
    setStatus("sending")
    setError("")
    const result = await submitVoice({ quote, words: selected, name, company })
    if (result.ok) setStatus("success")
    else { setStatus("error"); setError(result.error) }
  }

  return (
    <main className="min-h-screen bg-foreground px-6 py-6 text-white">
      <header className="mx-auto flex max-w-3xl items-center justify-between">
        <Link href="/" className="text-left">
          <span className="block font-serif text-xl font-semibold tracking-[0.14em] text-brand">NJENGA</span>
          <span className="block font-serif text-[9px] tracking-[0.45em] text-mauve">PRODUCTIONS CO.</span>
        </Link>
        <nav aria-label="Site navigation" className="flex items-center gap-3">
          <Link href="/voices" className="rounded-full border border-brand bg-brand-light px-3 py-1.5 text-xs font-medium text-brand transition-opacity hover:opacity-80">Voices</Link>
          <span aria-hidden="true" className="h-4 w-px bg-white/[0.12]" />
          <Link href="/admin" className="rounded-full border border-white/[0.15] bg-transparent px-3 py-1.5 text-xs font-medium text-white/[0.4] transition-colors hover:border-white/30 hover:text-white/70">Admin</Link>
        </nav>
      </header>

      <div className="mx-auto max-w-3xl py-16">
        {status === "success" ? (
          <section className="rounded-xl border border-white/10 bg-foreground px-6 py-20 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-brand text-3xl text-brand">✓</div>
            <h1 className="font-serif text-3xl text-brand">Thank you for sharing your voice.</h1>
            <p className="mt-3 text-sm text-white/60">We&apos;ll review your testimonial and be in touch soon.</p>
          </section>
        ) : (
          <>
            <section>
              <p className="text-xs uppercase tracking-[0.25em] text-brand">The voices behind the work</p>
              <h1 className="mt-3 max-w-xl font-serif text-4xl leading-tight text-white sm:text-5xl">Words from the people we create with.</h1>
              <div className="mt-10">
                <Testimonials testimonials={testimonials} />
              </div>
            </section>

            <form onSubmit={handleSubmit} className="mt-12 rounded-xl border border-white/10 bg-[#1A1A1A] p-6 sm:p-8">
              <h2 className="font-serif text-2xl text-brand">Add your voice</h2>
              <p className="mt-2 text-sm text-white/55">What did it feel like to work with NJENGA?</p>
              <div className="mt-6 flex flex-wrap gap-2">{WORDS.map((word) => <button key={word} type="button" onClick={() => toggle(word)} className={`rounded-full border px-3 py-2 text-xs transition-all duration-150 ${selected.includes(word) ? "border-brand bg-brand text-foreground" : "border-white/15 bg-white/[0.04] text-white/70 hover:border-brand/60"}`}>{word}</button>)}</div>
              <label className="mt-7 block text-sm font-medium" htmlFor="voice-quote">In your own words <span className="text-brand">*</span></label>
              <textarea id="voice-quote" required value={quote} onChange={(event) => setQuote(event.target.value)} placeholder="We showed up to our event nervous about how it would look on camera — we didn&apos;t need to be. NJENGA handled everything." className="mt-2 min-h-36 w-full resize-y rounded-lg border border-white/15 bg-black/20 p-3 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-brand focus:ring-2 focus:ring-brand/20" />
              <div className="mt-5 grid gap-5 sm:grid-cols-2"><label className="text-sm">Name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Adrianne Holmes-Redwood" className="mt-2 w-full rounded-lg border border-white/15 bg-black/20 p-3 text-sm outline-none focus:border-brand" /></label><label className="text-sm">Company<input value={company} onChange={(event) => setCompany(event.target.value)} placeholder="e.g. Founder, Phoinix Premier Events" className="mt-2 w-full rounded-lg border border-white/15 bg-black/20 p-3 text-sm outline-none focus:border-brand" /></label></div>
              {error && <p className="mt-4 text-sm text-red-300" role="alert">{error}</p>}
              <button type="submit" disabled={!quote.trim() || status === "sending"} className="mt-7 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-foreground transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/40">{status === "sending" ? "Sending…" : "Submit your voice"}</button>
            </form>
          </>
        )}
      </div>
    </main>
  )
}
