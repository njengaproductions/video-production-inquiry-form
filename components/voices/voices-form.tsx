"use client"

import Link from "next/link"
import { useState } from "react"
import { submitVoice } from "@/app/actions/submit-voice"

const WORDS = ["Cinematic", "Showed up", "Exceeded expectations", "Changed the game", "Professional", "Creative", "Fast turnaround", "On brand", "Storytelling", "Legendary", "Detail-oriented", "Easy to work with"]

export type ApprovedVoice = {
  id: string
  name: string
  company: string
  role: string
  quote: string
  words: string[]
  logo_url: string | null
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).map((word) => word[0]).join("").slice(0, 2).toUpperCase()
}

function TestimonialCard({ testimonial }: { testimonial: ApprovedVoice }) {
  return (
    <article className="w-full border-l-[3px] border-primary bg-white/[0.04] p-8 shadow-[0_0_48px_-8px_rgba(181,82,10,0.18)] sm:p-10">
      <div aria-hidden="true" className="mb-5 h-[1.5px] w-8 bg-primary/50" />
      <blockquote className="font-serif text-base font-normal not-italic leading-[1.8] text-[rgba(255,255,255,0.9)]">{testimonial.quote}</blockquote>
      <div className="mt-7 flex items-center gap-3">
        {testimonial.logo_url ? (
          <img src={testimonial.logo_url} alt={`${testimonial.company || testimonial.name} logo`} className="h-10 w-10 flex-shrink-0 rounded-full border border-primary/30 bg-white object-contain p-1" />
        ) : (
          <div aria-hidden="true" className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-xs font-semibold text-primary">{initials(testimonial.name)}</div>
        )}
        <div>
          <p className="text-sm font-medium">{testimonial.name}</p>
          {(testimonial.company || testimonial.role) && <p className="text-xs text-white/50">{testimonial.company}{testimonial.company && testimonial.role ? " · " : ""}{testimonial.role}</p>}
        </div>
      </div>
      {testimonial.words.length > 0 && (
        <ul className="mt-6 flex flex-wrap gap-2" aria-label="Words used">
          {testimonial.words.map((tag) => <li key={tag} className="rounded-full border border-primary/40 bg-transparent px-2.5 py-1 text-[11px] text-primary/70">{tag}</li>)}
        </ul>
      )}
    </article>
  )
}

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      {direction === "left" ? <path d="M19 12H5m6-6-6 6 6 6" /> : <path d="M5 12h14m-6-6 6 6-6 6" />}
    </svg>
  )
}

function Testimonials({ testimonials }: { testimonials: ApprovedVoice[] }) {
  const [active, setActive] = useState(0)

  if (testimonials.length === 0) {
    return <p className="py-16 text-center font-serif text-lg italic text-muted">No voices yet. Be the first to share yours.</p>
  }

  const count = testimonials.length
  const current = Math.min(active, count - 1)
  const go = (next: number) => setActive((next + count) % count)

  return (
    <section aria-roledescription="carousel" aria-label="Client testimonials" className="mx-auto max-w-2xl">
      <div aria-live="polite" aria-atomic="true">
        <TestimonialCard key={testimonials[current].id} testimonial={testimonials[current]} />
      </div>
      {count > 1 && (
        <div className="mt-8 flex items-center justify-center gap-6">
          <button type="button" onClick={() => go(current - 1)} aria-label="Previous testimonial" className="text-white/40 transition-colors hover:text-primary">
            <ArrowIcon direction="left" />
          </button>
          <div className="flex items-center gap-2">
            {testimonials.map((testimonial, index) => (
              <button key={testimonial.id} type="button" onClick={() => go(index)} aria-label={`Show testimonial ${index + 1} of ${count}`} aria-current={index === current} className={`h-1.5 rounded-full transition-all ${index === current ? "w-5 bg-primary" : "w-1.5 bg-white/25 hover:bg-white/50"}`} />
            ))}
          </div>
          <button type="button" onClick={() => go(current + 1)} aria-label="Next testimonial" className="text-white/40 transition-colors hover:text-primary">
            <ArrowIcon direction="right" />
          </button>
        </div>
      )}
    </section>
  )
}

export function VoicesForm({ testimonials }: { testimonials: ApprovedVoice[] }) {
  const [selected, setSelected] = useState<string[]>([])
  const [quote, setQuote] = useState("")
  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [role, setRole] = useState("")
  const [companyMode, setCompanyMode] = useState(false)
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle")
  const [error, setError] = useState("")

  const toggle = (word: string) => setSelected((current) => current.includes(word) ? current.filter((item) => item !== word) : [...current, word])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!quote.trim() || !name.trim() || (companyMode && !company.trim())) return
    setStatus("sending")
    setError("")
    const result = await submitVoice({ quote, words: selected, name, company: companyMode ? company : "", role: companyMode ? role : "" })
    if (result.ok) setStatus("success")
    else { setStatus("error"); setError(result.error) }
  }

  return (
    <main className="min-h-screen bg-foreground px-6 py-6 text-white">
      <header className="mx-auto flex max-w-3xl items-center justify-between">
        <Link prefetch href="/" className="text-left">
          <span className="block font-serif text-xl font-semibold tracking-[0.14em] text-brand">NJENGA</span>
          <span className="block font-serif text-[9px] font-light tracking-[6px] text-mauve">PRODUCTIONS CO.</span>
        </Link>
        <nav aria-label="Site navigation" className="flex items-center gap-3">
          <Link prefetch href="/voices" className="rounded-full border border-brand bg-brand-light px-3 py-1.5 text-xs font-medium text-brand transition-opacity hover:opacity-80">Voices</Link>
          <span aria-hidden="true" className="h-4 w-px bg-white/[0.12]" />
          <Link prefetch href="/admin" className="rounded-full border border-white/[0.15] bg-transparent px-3 py-1.5 text-xs font-medium text-white/[0.4] transition-colors hover:border-white/30 hover:text-white/70">Admin</Link>
        </nav>
      </header>

      <div className="mx-auto max-w-3xl py-16">
        {status === "success" ? (
          <section className="rounded-xl border border-white/10 bg-foreground px-6 py-20 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-brand text-3xl text-brand">✓</div>
            <h1 className="font-serif text-3xl text-brand">Thank you{name.trim() ? `, ${name.trim().split(/\s+/)[0]}` : ""}.</h1>
            <p className="mt-3 text-sm text-white/60">We&apos;ll review your testimonial and be in touch soon.</p>
          </section>
        ) : (
          <>
            <section>
              <p className="text-xs uppercase tracking-[4px] text-brand">The voices behind the work</p>
              <h1 className="mt-4 max-w-xl font-serif text-4xl leading-tight text-white sm:text-5xl">Words from the people we create with.</h1>
              <div className="mt-16 sm:mt-20">
                <Testimonials testimonials={testimonials} />
              </div>
            </section>

            <form onSubmit={handleSubmit} className="mt-12 rounded-xl border border-white/10 bg-[#1A1A1A] p-6 sm:p-8">
              <h2 className="font-serif text-2xl text-brand">Add your voice</h2>
              <p className="mt-2 text-sm text-white/55">What did it feel like to work with NJENGA?</p>
              <div className="mt-6 flex flex-wrap gap-2">{WORDS.map((word) => <button key={word} type="button" onClick={() => toggle(word)} className={`rounded-full border px-3 py-2 text-xs transition-all duration-150 ${selected.includes(word) ? "border-brand bg-brand text-foreground" : "border-white/15 bg-white/[0.04] text-white/70 hover:border-brand/60"}`}>{word}</button>)}</div>
              <label className="mt-7 block text-sm font-medium" htmlFor="voice-quote">In your own words <span className="text-brand">*</span></label>
              <textarea id="voice-quote" required value={quote} onChange={(event) => setQuote(event.target.value)} placeholder="We showed up to our event nervous about how it would look on camera — we didn&apos;t need to be. NJENGA handled everything." className="mt-2 min-h-36 w-full resize-y rounded-lg border border-white/15 bg-black/20 p-3 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-brand focus:ring-2 focus:ring-brand/20" />
              <label className="mt-5 block text-sm" htmlFor="voice-name">Your name <span className="text-brand">*</span><input id="voice-name" required value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" className="mt-2 w-full rounded-lg border border-white/15 bg-black/20 p-3 text-sm outline-none focus:border-brand" /></label>
              <div className="mt-5">
                <button type="button" aria-expanded={companyMode} onClick={() => { setCompanyMode((current) => { if (current) { setCompany(""); setRole("") }; return !current }) }} className="text-left text-sm text-white/70 hover:text-white">{companyMode ? "−" : "+"} Leaving this review on behalf of a company or organization?</button>
                {companyMode && <div className="mt-4 grid gap-5 sm:grid-cols-2"><label className="text-sm">Company or organization name <span className="text-brand">*</span><input required value={company} onChange={(event) => setCompany(event.target.value)} placeholder="e.g. Phoinix Premier Events" className="mt-2 w-full rounded-lg border border-white/15 bg-black/20 p-3 text-sm outline-none focus:border-brand" /></label><label className="text-sm">Role or title<input value={role} onChange={(event) => setRole(event.target.value)} placeholder="e.g. Founder & Principal Planner" className="mt-2 w-full rounded-lg border border-white/15 bg-black/20 p-3 text-sm outline-none focus:border-brand" /></label></div>}
              </div>
              {error && <p className="mt-4 text-sm text-red-300" role="alert">{error}</p>}
              <button type="submit" disabled={!quote.trim() || !name.trim() || (companyMode && !company.trim()) || status === "sending"} className="mt-7 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-foreground transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/40">{status === "sending" ? "Sending…" : "Submit your voice"}</button>
            </form>
          </>
        )}
      </div>
    </main>
  )
}
