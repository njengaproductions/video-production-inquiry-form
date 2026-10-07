"use client"

import Link from "next/link"
import { useLenis } from "lenis/react"
import { useEffect, useRef, useState, type MouseEvent } from "react"
import { useInView, useScrollProgress } from "./use-scroll-progress"
import type { ApprovedVoice } from "./voices-form"

export const HEADLINE = "#f0ece6"

export const WORDS = ["Cinematic", "Showed up", "Exceeded expectations", "Changed the game", "Professional", "Creative", "Fast turnaround", "On brand", "Storytelling", "Legendary", "Detail-oriented", "Easy to work with", "Prepared", "Communicative", "High quality", "Would refer", "Already referred", "Understood the vision"]

const FORM_ID = "add-your-voice"

/** Opaque, stacked scene that casts a soft shadow upward as it slides over the previous one. */
export const SCENE_EDGE = "relative shadow-[0_-40px_80px_rgba(0,0,0,0.65)]"

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).map((word) => word[0]).join("").slice(0, 2).toUpperCase()
}

function AddVoicePill() {
  const lenis = useLenis()
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!lenis) return
    event.preventDefault()
    lenis.scrollTo(`#${FORM_ID}`, { duration: 1.6 })
  }
  return <a href={`#${FORM_ID}`} onClick={onClick} className="rounded-full border border-primary px-4 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10">+ Add your voice</a>
}

export function VoicesHero({ count }: { count: number }) {
  return (
    <section className="sticky top-0 z-0 flex min-h-screen flex-col overflow-hidden bg-[#0a0806] px-6">
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between py-6">
        <Link prefetch href="/" className="text-left">
          <span className="block font-serif text-xl font-bold tracking-[0.14em] text-brand">NJENGA</span>
          <span className="block font-serif text-[9px] font-light tracking-[6px] text-mauve">PRODUCTIONS CO.</span>
        </Link>
        <nav aria-label="Site navigation" className="flex items-center gap-3">
          <AddVoicePill />
          <span aria-hidden="true" className="h-4 w-px bg-white/[0.12]" />
          <Link prefetch href="/admin" className="text-xs font-medium text-[rgba(240,236,230,0.62)] transition-colors hover:text-[#f0ece6]">Admin</Link>
        </nav>
      </header>

      <div className="relative mx-auto flex w-full max-w-6xl flex-1 items-center justify-center py-16">
        <span aria-hidden="true" className="pointer-events-none absolute select-none font-serif text-[clamp(96px,20vw,180px)] font-normal leading-none tracking-[0.04em] text-[rgba(181,82,10,0.03)]">VOICES</span>
        <h1 className="relative text-center font-serif text-[38px] font-normal leading-[1.1] md:text-[52px]" style={{ color: HEADLINE }}>
          <span className="block">Words from</span>
          <span className="block" style={{ color: "rgba(240,236,230,0.18)" }}>the people</span>
          <span className="block">we create with.</span>
        </h1>
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl items-end justify-between gap-6 pb-8">
        <p className="max-w-[10rem] text-[9px] font-semibold uppercase tracking-[5px] text-primary">The voices behind the work</p>
        <div className="text-right">
          <p className="font-serif text-[52px] font-normal leading-none text-[rgba(181,82,10,0.35)]">{count}</p>
          <p className="mt-2 text-[8px] uppercase tracking-[3px] text-[rgba(240,236,230,0.62)]">Voices &amp; counting</p>
        </div>
        <div aria-hidden="true" className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 sm:flex">
          <span className="text-[8px] uppercase tracking-[3px] text-[rgba(240,236,230,0.62)]">Scroll to explore</span>
          <span className="voices-scroll-cue block h-8 w-px bg-primary/40" />
        </div>
      </div>
    </section>
  )
}

export function PinnedQuote({ voice }: { voice?: ApprovedVoice }) {
  const [ref, progress] = useScrollProgress<HTMLElement>(1)
  const quote = voice?.quote ?? "Every project. Every moment. Captured with intention."
  const words = quote.split(/\s+/).filter(Boolean)
  const accentFrom = Math.max(0, words.length - 3)
  const showAttribution = progress > 0.85

  return (
    <section ref={ref} aria-label="Featured voice" className={`${SCENE_EDGE} z-10 h-[240vh] bg-[#0b0907]`}>
      <div className="sticky top-0 flex h-screen items-center justify-center px-6">
        <figure className="mx-auto max-w-3xl text-center">
          <blockquote className="font-serif text-[22px] font-normal leading-[1.55] md:text-[26px]">
            <span className="sr-only">{quote}</span>
            <span aria-hidden="true">
              {words.map((word, index) => {
                const lit = progress >= 0.05 + (index / words.length) * 0.75
                const color = lit ? (index >= accentFrom ? "var(--primary)" : HEADLINE) : "rgba(255,255,255,0.08)"
                return <span key={index} className="transition-colors duration-300" style={{ color }}>{word}{index < words.length - 1 ? " " : ""}</span>
              })}
            </span>
          </blockquote>
          {voice && (
            <figcaption className={`mt-10 transition-all duration-700 ${showAttribution ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}>
              <p className="text-sm font-medium text-[#f0ece6]">{voice.name}</p>
              {(voice.company || voice.role) && <p className="mt-1 text-xs text-[rgba(240,236,230,0.62)]">{voice.company}{voice.company && voice.role ? " · " : ""}{voice.role}</p>}
            </figcaption>
          )}
        </figure>
      </div>
    </section>
  )
}

const BURST_CHIPS = WORDS.map((word, index) => ({
  word,
  angle: (index / WORDS.length) * Math.PI * 2 - Math.PI / 2 + (index % 2 ? 0.18 : -0.08),
  reach: index % 3 === 0 ? 1 : index % 3 === 1 ? 0.72 : 0.86,
  delay: (index % 4) * 0.08,
}))

export function ChipBurst() {
  const [ref, progress] = useScrollProgress<HTMLElement>(1)
  const burst = Math.sin(Math.PI * progress)

  return (
    <section ref={ref} aria-label="Words clients use to describe us" className={`${SCENE_EDGE} z-20 -mt-[100vh] h-[300vh] bg-[#0c0a07]`}>
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        <p className="relative z-10 text-center font-serif text-[22px] font-normal md:text-[28px]" style={{ color: HEADLINE, opacity: 0.25 + burst * 0.75 }}>
          In their <span className="text-primary">words.</span>
        </p>
        <ul className="absolute inset-0">
          {BURST_CHIPS.map(({ word, angle, reach, delay }) => {
            const local = Math.min(1, Math.max(0, (burst - delay) / (1 - delay)))
            const distance = local * reach
            return (
              <li
                key={word}
                className="absolute left-1/2 top-1/2 whitespace-nowrap rounded-full border border-primary/30 bg-[#0c0a07] px-4 py-1.5 text-[10px] tracking-[0.5px] text-primary will-change-transform md:text-xs"
                style={{
                  opacity: local,
                  transform: `translate(-50%,-50%) translate(calc(${Math.cos(angle) * distance} * min(42vw, 420px)), calc(${Math.sin(angle) * distance} * min(34vh, 320px))) scale(${0.6 + local * 0.4})`,
                }}
              >
                {word}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

function VoiceCard({ voice, mauve }: { voice: ApprovedVoice; mauve: boolean }) {
  return (
    <article className={`flex h-full w-[min(80vw,400px)] flex-shrink-0 flex-col rounded-r-[10px] border-l-2 bg-[rgba(181,82,10,0.03)] p-7 ${mauve ? "border-mauve" : "border-primary"}`}>
      <blockquote className="font-serif text-[17px] font-normal leading-[1.65] text-[#f0ece6]">{voice.quote}</blockquote>
      <div className="mt-auto pt-8">
        <div className="flex items-center gap-3">
          {voice.logo_url ? (
            <img src={voice.logo_url} alt={`${voice.company || voice.name} logo`} className="h-10 w-10 flex-shrink-0 rounded-full border border-white/15 bg-white object-contain p-1" />
          ) : (
            <div aria-hidden="true" className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${mauve ? "border-mauve/40 bg-mauve/10 text-mauve" : "border-primary/30 bg-primary/10 text-primary"}`}>{initials(voice.name)}</div>
          )}
          <div>
            <p className="text-sm font-medium text-[#f0ece6]">{voice.name}</p>
            {(voice.company || voice.role) && <p className="text-xs text-[rgba(240,236,230,0.62)]">{voice.company}{voice.company && voice.role ? " · " : ""}{voice.role}</p>}
          </div>
        </div>
        {voice.words.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-2" aria-label="Words used">
            {voice.words.map((word) => <li key={word} className={`rounded-full border px-2.5 py-1 text-[10px] tracking-[0.5px] ${mauve ? "border-mauve/40 text-mauve" : "border-primary/30 text-primary"}`}>{word}</li>)}
          </ul>
        )}
      </div>
    </article>
  )
}

export function HorizontalVoices({ voices }: { voices: ApprovedVoice[] }) {
  const [ref, progress] = useScrollProgress<HTMLElement>(1)
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [maxShift, setMaxShift] = useState(0)

  useEffect(() => {
    const measure = () => {
      if (!viewportRef.current || !trackRef.current) return
      setMaxShift(Math.max(0, trackRef.current.scrollWidth - viewportRef.current.clientWidth))
    }
    measure()
    const observer = new ResizeObserver(measure)
    if (viewportRef.current) observer.observe(viewportRef.current)
    if (trackRef.current) observer.observe(trackRef.current)
    return () => observer.disconnect()
  }, [voices.length])

  if (voices.length === 0) {
    return <p className={`${SCENE_EDGE} z-30 bg-[#0d0a07] px-6 py-24 text-center font-serif text-lg text-[rgba(240,236,230,0.62)]`}>No voices yet. Be the first to share yours.</p>
  }

  const current = Math.min(voices.length, Math.floor(progress * voices.length) + 1)

  return (
    <section ref={ref} aria-label="All voices" className={`${SCENE_EDGE} z-30 -mt-[100vh] h-[300vh] bg-[#0d0a07]`}>
      <div className="sticky top-0 flex h-screen flex-col justify-center gap-10 overflow-hidden py-12">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6">
          <p className="text-[9px] font-semibold uppercase tracking-[5px] text-primary">All voices</p>
          <p className="font-serif text-sm text-[rgba(240,236,230,0.62)]" aria-live="polite"><span style={{ color: HEADLINE }}>{current}</span> / {voices.length}</p>
        </div>
        <div ref={viewportRef} className="mx-auto w-full max-w-6xl px-6">
          <div ref={trackRef} className="flex w-max gap-6 will-change-transform" style={{ transform: `translate3d(${-progress * maxShift}px,0,0)` }}>
            {voices.map((voice, index) => <VoiceCard key={voice.id} voice={voice} mauve={index % 2 === 1} />)}
          </div>
        </div>
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="h-px w-full bg-white/10" role="progressbar" aria-label="Voices progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
            <div className="h-px origin-left bg-primary" style={{ transform: `scaleX(${progress})` }} />
          </div>
        </div>
      </div>
    </section>
  )
}

export function GiantCounter({ count, overlap }: { count: number; overlap: boolean }) {
  const [ref, visible] = useInView<HTMLElement>()
  return (
    <section ref={ref} data-visible={visible} className={`voices-counter ${SCENE_EDGE} z-40 flex min-h-screen flex-col items-center justify-center bg-[#0e0b08] px-6 py-32 text-center ${overlap ? "-mt-[100vh]" : ""}`}>
      <p className="voices-counter-number font-serif text-[120px] font-normal leading-none">{count}</p>
      <p className="voices-counter-label mt-4 text-[8px] uppercase tracking-[3px] text-[rgba(240,236,230,0.62)]">Voices &amp; counting</p>
      <p className="voices-counter-phrase mt-6 font-serif text-lg italic text-[rgba(240,236,230,0.62)]">People we&apos;ve had the privilege of creating with.</p>
    </section>
  )
}
