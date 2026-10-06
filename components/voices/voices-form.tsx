"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { submitVoice } from "@/app/actions/submit-voice"
import { SmoothScroll } from "./smooth-scroll"
import { DoubleMarquee, GiantCounter, HEADLINE, HorizontalVoices, PinnedQuote, VoicesHero, WORDS } from "./voices-scenes"

export type ApprovedVoice = {
  id: string
  name: string
  company: string
  role: string
  quote: string
  words: string[]
  logo_url: string | null
}

function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    let firstCheck = true
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        // Content already on screen at load is shown without animating; only scroll entry animates
        if (firstCheck) node.classList.add("reveal-instant")
        node.classList.add("is-visible")
        observer.disconnect()
      }
      firstCheck = false
    }, { threshold: 0.15 })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return <div ref={ref} className={`reveal ${className}`}>{children}</div>
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
    <main className="min-h-screen bg-[#0a0806] text-white">
      <SmoothScroll />

      {status === "success" ? (
        <div className="mx-auto max-w-3xl px-6 py-20">
          <section className="lux-card rounded-xl border border-white/10 bg-foreground px-6 py-20 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-brand text-3xl text-brand">✓</div>
            <h1 className="lux-headline" style={{ color: HEADLINE }}>Thank you{name.trim() ? `, ${name.trim().split(/\s+/)[0]}` : ""}.</h1>
            <p className="mt-3 text-sm text-white/60">We&apos;ll review your testimonial and be in touch soon.</p>
          </section>
        </div>
      ) : (
        <>
          <VoicesHero count={testimonials.length} />
          <PinnedQuote voice={testimonials[0]} />
          <DoubleMarquee />
          <HorizontalVoices voices={testimonials} />
          <GiantCounter count={testimonials.length} />

          <section id="add-your-voice" className="scroll-mt-6 border-t border-primary/15 bg-[#0a0806] px-6 py-24 md:py-32">
            <Reveal className="mx-auto max-w-2xl">
              <form onSubmit={handleSubmit}>
                <p className="text-[9px] font-semibold uppercase tracking-[5px] text-primary">Share your experience</p>
                <h2 className="mt-4 font-serif text-[30px] font-normal leading-[1.15] md:text-[36px]" style={{ color: HEADLINE }}>Add your voice.</h2>
                <p className="mt-3 text-sm text-white/55">What did it feel like to work with NJENGA? Pick any words that fit — all optional.</p>
                <div className="mt-7 flex flex-wrap gap-2">{WORDS.map((word) => <button key={word} type="button" onClick={() => toggle(word)} aria-pressed={selected.includes(word)} className="lux-chip">{word}</button>)}</div>
                <label className="lux-label mt-9 block text-white/55" htmlFor="voice-quote">In your own words <span className="text-brand">*</span></label>
                <textarea id="voice-quote" required value={quote} onChange={(event) => setQuote(event.target.value)} placeholder="We showed up to our event nervous about how it would look on camera — we didn't need to be. NJENGA handled everything." className="mt-2 min-h-36 w-full resize-y rounded-lg border border-white/15 bg-black/20 p-3 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-brand focus:ring-2 focus:ring-brand/20" />
                <label className="mt-6 block text-sm" htmlFor="voice-name"><span className="lux-label text-white/55">Your name <span className="text-brand">*</span></span><input id="voice-name" required value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" className="mt-2 w-full rounded-lg border border-white/15 bg-black/20 p-3 text-sm outline-none placeholder:text-white/30 focus:border-brand" /></label>
                <div className="mt-5">
                  <button type="button" aria-expanded={companyMode} onClick={() => { setCompanyMode((current) => { if (current) { setCompany(""); setRole("") }; return !current }) }} className="text-left text-sm text-white/70 hover:text-white">{companyMode ? "−" : "+"} Leaving this review on behalf of a company or organization?</button>
                  {companyMode && <div className="mt-4 grid gap-5 sm:grid-cols-2"><label className="text-sm"><span className="lux-label text-white/55">Company or organization name <span className="text-brand">*</span></span><input required value={company} onChange={(event) => setCompany(event.target.value)} placeholder="e.g. Phoinix Premier Events" className="mt-2 w-full rounded-lg border border-white/15 bg-black/20 p-3 text-sm outline-none placeholder:text-white/30 focus:border-brand" /></label><label className="text-sm"><span className="lux-label text-white/55">Role or title</span><input value={role} onChange={(event) => setRole(event.target.value)} placeholder="e.g. Founder & Principal Planner" className="mt-2 w-full rounded-lg border border-white/15 bg-black/20 p-3 text-sm outline-none placeholder:text-white/30 focus:border-brand" /></label></div>}
                </div>
                {error && <p className="mt-4 text-sm text-red-300" role="alert">{error}</p>}
                <button type="submit" disabled={!quote.trim() || !name.trim() || (companyMode && !company.trim()) || status === "sending"} className="mt-8 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-foreground transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/40">{status === "sending" ? "Sending…" : "Submit your voice"}</button>
              </form>
            </Reveal>
          </section>
        </>
      )}
    </main>
  )
}
