"use client"

import { useEffect, useState } from "react"
import { MotionConfig, motion } from "framer-motion"
import { submitVoice } from "@/app/actions/submit-voice"
import type { LogoDisplay } from "@/lib/logo-display"
import { SmoothScroll } from "./smooth-scroll"
import { ChipBurst, GiantCounter, HEADLINE, HorizontalVoices, PinnedQuote, SCENE_EDGE, VoicesHero, WORDS, reveal } from "./voices-scenes"

export type ApprovedVoice = {
  id: string
  name: string
  company: string
  role: string
  quote: string
  words: string[]
  logo_url: string | null
  logo_display?: LogoDisplay | null
}

const CHIP_GRID = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } }
const CHIP = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

export function VoicesForm({ testimonials, photos = [] }: { testimonials: ApprovedVoice[]; photos?: string[] }) {
  const [selected, setSelected] = useState<string[]>([])
  const [quote, setQuote] = useState("")
  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [role, setRole] = useState("")
  const [companyMode, setCompanyMode] = useState(false)
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle")
  const [error, setError] = useState("")
  const [shuffled, setShuffled] = useState(() => testimonials.slice(0, 5))
  const [show, setShow] = useState(false)

  // Shuffled after mount so the server and first client render match (no hydration mismatch).
  useEffect(() => {
    const pool = [...testimonials]
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    setShuffled(pool.slice(0, 5))
  }, [testimonials])

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY / document.body.scrollHeight > 0.65)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
    <main className="voices-page min-h-full text-[#f0ece6]" style={{ backgroundColor: "#0a0806", overscrollBehavior: "none" }}>
      <SmoothScroll />
      <MotionConfig reducedMotion="user">

      {status === "success" ? (
        <div className="mx-auto max-w-3xl bg-[#0a0806] px-6 py-20">
          <section className="lux-card rounded-xl border border-white/10 px-6 py-20 text-center" style={{ backgroundColor: "#0a0806" }}>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-brand text-3xl text-brand">✓</div>
            <h1 className="lux-headline" style={{ color: HEADLINE }}>Thank you{name.trim() ? `, ${name.trim().split(/\s+/)[0]}` : ""}.</h1>
            <p className="mt-3 text-sm text-[rgba(240,236,230,0.62)]">We&apos;ll review your testimonial and be in touch soon.</p>
          </section>
        </div>
      ) : (
        <>
          <VoicesHero count={testimonials.length} photos={photos} />
          <PinnedQuote voice={testimonials[0]} />
          <ChipBurst voices={testimonials} />
          <HorizontalVoices voices={shuffled} />
          <GiantCounter count={testimonials.length} overlap={testimonials.length > 0} />

          <section id="add-your-voice" className={`${SCENE_EDGE} z-10 scroll-mt-6 bg-[#0a0806] px-6 py-24 md:py-32`}>
            <div className="mx-auto max-w-2xl">
              <form onSubmit={handleSubmit}>
                <motion.div {...reveal()}>
                <p className="text-[9px] font-semibold uppercase tracking-[5px] text-primary">Share your experience</p>
                <h2 className="mt-4 font-serif text-[30px] font-normal leading-[1.15] md:text-[36px]" style={{ color: HEADLINE }}>Add your voice.</h2>
                <p className="mt-3 text-sm text-[rgba(240,236,230,0.62)]">What did it feel like to work with NJENGA? Pick any words that fit — all optional.</p>
                </motion.div>
                <motion.div {...reveal(0.1)}>
                <motion.div variants={CHIP_GRID} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} className="mt-7 flex flex-wrap gap-2">{WORDS.map((word) => <motion.button key={word} variants={CHIP} type="button" onClick={() => toggle(word)} aria-pressed={selected.includes(word)} className="voices-chip">{word}</motion.button>)}</motion.div>
                <label className="lux-label mt-9 block text-[rgba(240,236,230,0.62)]" htmlFor="voice-quote">In your own words <span className="text-brand">*</span></label>
                <textarea id="voice-quote" required maxLength={500} value={quote} onChange={(event) => setQuote(event.target.value)} placeholder="We showed up to our event nervous about how it would look on camera — we didn't need to be. NJENGA handled everything." className="mt-2 min-h-36 w-full resize-y rounded-lg border border-white/15 bg-black/20 p-3 text-sm text-[#f0ece6] outline-none transition-colors placeholder:text-[rgba(240,236,230,0.28)] focus:border-brand focus:ring-2 focus:ring-brand/20" />
                <p className="mt-1.5 text-right font-sans text-[11px] text-muted-foreground" style={{ color: quote.length >= 480 ? '#B15927' : undefined }}>
                  {500 - quote.length} characters remaining
                </p>
                <label className="mt-6 block text-sm" htmlFor="voice-name"><span className="lux-label text-[rgba(240,236,230,0.62)]">Your name <span className="text-brand">*</span></span><input id="voice-name" required value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" className="mt-2 w-full rounded-lg border border-white/15 bg-black/20 p-3 text-sm outline-none placeholder:text-[rgba(240,236,230,0.28)] focus:border-brand" /></label>
                <div className="mt-5">
                  <button type="button" aria-expanded={companyMode} onClick={() => { setCompanyMode((current) => { if (current) { setCompany(""); setRole("") }; return !current }) }} className="text-left text-sm text-[rgba(240,236,230,0.62)] hover:text-[#f0ece6]">{companyMode ? "−" : "+"} Leaving this review on behalf of a company or organization?</button>
                  {companyMode && <div className="mt-4 grid gap-5 sm:grid-cols-2"><label className="text-sm"><span className="lux-label text-[rgba(240,236,230,0.62)]">Company or organization name <span className="text-brand">*</span></span><input required value={company} onChange={(event) => setCompany(event.target.value)} placeholder="e.g. Phoinix Premier Events" className="mt-2 w-full rounded-lg border border-white/15 bg-black/20 p-3 text-sm outline-none placeholder:text-[rgba(240,236,230,0.28)] focus:border-brand" /></label><label className="text-sm"><span className="lux-label text-[rgba(240,236,230,0.62)]">Role or title</span><input value={role} onChange={(event) => setRole(event.target.value)} placeholder="e.g. Founder & Principal Planner" className="mt-2 w-full rounded-lg border border-white/15 bg-black/20 p-3 text-sm outline-none placeholder:text-[rgba(240,236,230,0.28)] focus:border-brand" /></label></div>}
                </div>
                {error && <p className="mt-4 text-sm text-red-300" role="alert">{error}</p>}
                <button type="submit" disabled={!quote.trim() || !name.trim() || (companyMode && !company.trim()) || status === "sending"} className="mt-8 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-foreground transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-[rgba(240,236,230,0.62)]">{status === "sending" ? "Sending…" : "Submit your voice"}</button>
                </motion.div>
              </form>
            </div>
          </section>
        </>
      )}
      </MotionConfig>
      {show && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 z-50 flex items-center gap-2 rounded-full border border-[#f0ece6]/20 bg-[#0a0806] px-4 py-2 font-sans text-xs uppercase tracking-widest text-[#f0ece6] transition-opacity hover:border-[#B15927]"
        >
          ↑ Top
        </button>
      )}
    </main>
  )
}
