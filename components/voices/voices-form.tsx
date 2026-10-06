"use client"

import Link from "next/link"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { submitVoice } from "@/app/actions/submit-voice"

const WORDS = ["Cinematic", "Showed up", "Exceeded expectations", "Changed the game", "Professional", "Creative", "Fast turnaround", "On brand", "Storytelling", "Legendary", "Detail-oriented", "Easy to work with"]

const HEADLINE = "#f0ece6"

export type ApprovedVoice = {
  id: string
  name: string
  company: string
  role: string
  quote: string
  words: string[]
  logo_url: string | null
}

type Accent = "primary" | "mauve"

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).map((word) => word[0]).join("").slice(0, 2).toUpperCase()
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

function VoiceCard({ voice, accent = "primary", large = false }: { voice: ApprovedVoice; accent?: Accent; large?: boolean }) {
  const isMauve = accent === "mauve"
  return (
    <article className={`flex h-full flex-col rounded-r-[10px] border-l-2 bg-[rgba(181,82,10,0.03)] p-7 ${isMauve ? "border-mauve" : "border-primary"}`}>
      <div aria-hidden="true" className={`h-px w-8 ${isMauve ? "bg-mauve" : "bg-primary"}`} />
      <blockquote className={`mt-6 font-serif font-normal not-italic text-white/[0.88] ${large ? "text-[22px] leading-[1.6] md:text-[26px]" : "text-[17px] leading-[1.65]"}`}>{voice.quote}</blockquote>
      <div className="mt-auto pt-8">
        <div className="flex items-center gap-3">
          {voice.logo_url ? (
            <img src={voice.logo_url} alt={`${voice.company || voice.name} logo`} className="h-10 w-10 flex-shrink-0 rounded-full border border-white/15 bg-white object-contain p-1" />
          ) : (
            <div aria-hidden="true" className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${isMauve ? "border-mauve/40 bg-mauve/10 text-mauve" : "border-primary/30 bg-primary/10 text-primary"}`}>{initials(voice.name)}</div>
          )}
          <div>
            <p className="text-sm font-medium text-white">{voice.name}</p>
            {(voice.company || voice.role) && <p className="text-xs text-white/50">{voice.company}{voice.company && voice.role ? " · " : ""}{voice.role}</p>}
          </div>
        </div>
        {voice.words.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-2" aria-label="Words used">
            {voice.words.map((word) => <li key={word} className={`rounded-full border px-2.5 py-1 text-[10px] tracking-[0.5px] ${isMauve ? "border-mauve/40 text-mauve" : "border-primary/30 text-primary/70"}`}>{word}</li>)}
          </ul>
        )}
      </div>
    </article>
  )
}

function BentoGrid({ voices }: { voices: ApprovedVoice[] }) {
  if (voices.length === 0) {
    return <p className="py-16 text-center font-serif text-lg text-white/50">No voices yet. Be the first to share yours.</p>
  }

  if (voices.length < 3) {
    return (
      <div className="mx-auto max-w-2xl">
        <Reveal><VoiceCard voice={voices[0]} large /></Reveal>
      </div>
    )
  }

  const groups: ApprovedVoice[][] = []
  for (let index = 0; index < voices.length; index += 3) groups.push(voices.slice(index, index + 3))

  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) =>
        group.length === 3 ? (
          <div key={group[0].id} className="grid gap-5 md:grid-cols-2 md:grid-rows-2">
            <Reveal className="md:row-span-2"><VoiceCard voice={group[0]} large /></Reveal>
            <Reveal><VoiceCard voice={group[1]} /></Reveal>
            <Reveal><VoiceCard voice={group[2]} accent="mauve" /></Reveal>
          </div>
        ) : (
          <div key={group[0].id} className="grid gap-5 md:grid-cols-2">
            {group.map((voice, index) => <Reveal key={voice.id}><VoiceCard voice={voice} accent={index === 1 ? "mauve" : "primary"} /></Reveal>)}
          </div>
        ),
      )}
    </div>
  )
}

function ChipMarquee() {
  return (
    <div className="overflow-hidden border-y border-primary/25 py-5" aria-label="Words clients use to describe us">
      <ul className="voices-chip-marquee flex w-max gap-3">
        {[...WORDS, ...WORDS].map((word, index) => (
          <li key={`${word}-${index}`} aria-hidden={index >= WORDS.length} className="whitespace-nowrap rounded-full border border-primary/[0.28] px-4 py-1.5 text-[10px] tracking-[0.5px] text-primary/50">{word}</li>
        ))}
      </ul>
    </div>
  )
}

function Hero({ count }: { count: number }) {
  return (
    <section className="mx-auto flex min-h-[280px] max-w-5xl flex-col gap-10 px-6 pb-16 pt-16 md:flex-row md:items-end md:justify-between">
      <div className="max-w-xl">
        <p className="text-[9px] font-semibold uppercase tracking-[5px] text-primary">The voices behind the work</p>
        <h1 className="mt-5 text-balance font-serif text-[38px] font-normal leading-[1.1] md:text-[52px]" style={{ color: HEADLINE }}>Words from the people we create with.</h1>
      </div>
      <div className="flex flex-col items-start md:items-end">
        <p className="font-serif text-[64px] font-normal leading-none text-[rgba(181,82,10,0.45)]">{count}</p>
        <p className="mt-2 text-[9px] uppercase tracking-[3px] text-white/[0.22]">Voices &amp; counting</p>
        <a href="#add-your-voice" className="mt-6 rounded-full border border-primary px-4 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10">+ Add your voice</a>
      </div>
    </section>
  )
}

function Statement() {
  return (
    <Reveal>
      <section className="border-y border-primary/25 px-6 py-20 text-center">
        <p className="mx-auto max-w-3xl text-balance font-serif text-[24px] font-normal leading-[1.4] text-white/[0.82] md:text-[28px]">
          Every project. Every moment. <span className="text-primary">Captured with intention.</span>
        </p>
      </section>
    </Reveal>
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
    <main className="min-h-screen bg-foreground text-white">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Link prefetch href="/" className="text-left">
          <span className="block font-serif text-xl font-bold tracking-[0.14em] text-brand">NJENGA</span>
          <span className="block font-serif text-[9px] font-light tracking-[6px] text-mauve">PRODUCTIONS CO.</span>
        </Link>
        <nav aria-label="Site navigation" className="flex items-center gap-3">
          <Link prefetch href="/voices" className="rounded-full border border-brand bg-brand-light px-3 py-1.5 text-xs font-medium text-brand transition-opacity hover:opacity-80">Voices</Link>
          <span aria-hidden="true" className="h-4 w-px bg-white/[0.12]" />
          <Link prefetch href="/admin" className="rounded-full border border-white/[0.15] bg-transparent px-3 py-1.5 text-xs font-medium text-white/[0.4] transition-colors hover:border-white/30 hover:text-white/70">Admin</Link>
        </nav>
      </header>

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
          <Hero count={testimonials.length} />
          <ChipMarquee />

          <section aria-label="Client testimonials" className="mx-auto max-w-5xl px-6 py-20">
            <BentoGrid voices={testimonials} />
          </section>

          <Statement />

          <section id="add-your-voice" className="scroll-mt-6 bg-[#141414] px-6 py-24">
            <Reveal className="mx-auto max-w-2xl">
              <form onSubmit={handleSubmit}>
                <p className="text-[9px] font-semibold uppercase tracking-[5px] text-primary">Share your experience</p>
                <h2 className="mt-4 font-serif text-[30px] font-normal leading-[1.15] md:text-[34px]" style={{ color: HEADLINE }}>Add your voice.</h2>
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
