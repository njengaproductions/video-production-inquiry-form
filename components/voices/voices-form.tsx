"use client"

import Link from "next/link"
import { useState } from "react"
import { submitVoice } from "@/app/actions/submit-voice"

const WORDS = ["Cinematic", "Showed up", "Exceeded expectations", "Changed the game", "Professional", "Creative", "Fast turnaround", "On brand", "Storytelling", "Legendary", "Detail-oriented", "Easy to work with"]

const TESTIMONIALS: Array<{
  name: string
  company: string
  quote: string
  tags: string[]
}> = []

function TestimonialCard({
  testimonial,
  index,
}: {
  testimonial: (typeof TESTIMONIALS)[number]
  index: number
}) {
  return (
    <article className={`w-[min(22rem,calc(100vw-3rem))] flex-shrink-0 border-l-2 ${index % 2 === 0 ? "border-brand" : "border-mauve"} bg-white/[0.04] p-5`}>
      <p className="font-serif text-lg italic leading-relaxed text-white/90">&ldquo;{testimonial.quote}&rdquo;</p>
      <div className="mt-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-xs font-semibold text-foreground">
          {testimonial.name.split(" ").map((word) => word[0]).join("").slice(0, 2)}
        </div>
        <div>
          <p className="text-sm font-medium">{testimonial.name}</p>
          <p className="text-xs text-white/50">{testimonial.company}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {testimonial.tags.map((tag) => <span key={tag} className="rounded-full bg-brand px-2.5 py-1 text-[10px] font-medium text-foreground">{tag}</span>)}
      </div>
    </article>
  )
}

function Testimonials() {
  if (TESTIMONIALS.length === 0) {
    return <p className="py-16 text-center font-serif text-lg italic text-muted">No voices yet. Be the first to share yours.</p>
  }

  if (TESTIMONIALS.length === 1) {
    return <div className="flex justify-center"><TestimonialCard testimonial={TESTIMONIALS[0]} index={0} /></div>
  }

  return (
    <div className="overflow-hidden">
      <div className="voices-marquee flex w-max gap-4 hover:[animation-play-state:paused]">
        {[...TESTIMONIALS, ...TESTIMONIALS].map((testimonial, index) => (
          <TestimonialCard key={`${testimonial.name}-${index}`} testimonial={testimonial} index={index % TESTIMONIALS.length} />
        ))}
      </div>
      <p className="mt-5 text-center text-xs text-muted">{TESTIMONIALS.length} voices and counting.</p>
    </div>
  )
}

export function VoicesForm() {
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
        <Link href="/" className="rounded-full border border-brand bg-brand-light px-3 py-1.5 text-xs font-medium text-brand transition-opacity hover:opacity-80">Project brief</Link>
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
                <Testimonials />
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
