"use client"

import Link from "next/link"
import { useLenis } from "lenis/react"
import { useEffect, useRef, useState, type MouseEvent } from "react"
import { useInView, useScrollProgress } from "./use-scroll-progress"
import type { ApprovedVoice } from "./voices-form"

export const HEADLINE = "#f0ece6"

export const WORDS = ["Cinematic", "Showed up", "Exceeded expectations", "Changed the game", "Professional", "Creative", "Fast turnaround", "On brand", "Storytelling", "Legendary", "Detail-oriented", "Easy to work with"]

const FORM_ID = "add-your-voice"

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
    <section className="relative flex min-h-svh flex-col overflow-hidden bg-[#0a0806] px-6">
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between py-6">
        <Link prefetch href="/" className="text-left">
          <span className="block font-serif text-xl font-bold tracking-[0.14em] text-brand">NJENGA</span>
          <span className="block font-serif text-[9px] font-light tracking-[6px] text-mauve">PRODUCTIONS CO.</span>
        </Link>
        <nav aria-label="Site navigation" className="flex items-center gap-3">
          <AddVoicePill />
          <span aria-hidden="true" className="h-4 w-px bg-white/[0.12]" />
          <Link prefetch href="/admin" className="text-xs font-medium text-white/40 transition-colors hover:text-white/70">Admin</Link>
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
          <p className="mt-2 text-[8px] uppercase tracking-[3px] text-white/30">Voices &amp; counting</p>
        </div>
        <div aria-hidden="true" className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 sm:flex">
          <span className="text-[8px] uppercase tracking-[3px] text-white/30">Scroll to explore</span>
          <span className="voices-scroll-cue block h-8 w-px bg-primary/40" />
        </div>
      </div>
    </section>
  )
}

export function PinnedQuote({ voice }: { voice?: ApprovedVoice }) {
  const [ref, progress] = useScrollProgress<HTMLElement>()
  const quote = voice?.quote ?? "Every project. Every moment. Captured with intention."
  const words = quote.split(/\s+/).filter(Boolean)
  const accentFrom = Math.max(0, words.length - 3)
  const showAttribution = progress > 0.85

  return (
    <section ref={ref} aria-label="Featured voice" className="relative min-h-[140vh] bg-[#0a0806]">
      <div className="sticky top-0 flex h-svh items-center justify-center px-6">
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
              <p className="text-sm font-medium text-white">{voice.name}</p>
              {(voice.company || voice.role) && <p className="mt-1 text-xs text-white/50">{voice.company}{voice.company && voice.role ? " · " : ""}{voice.role}</p>}
            </figcaption>
          )}
        </figure>
      </div>
    </section>
  )
}

function MarqueeRow({ words, reverse = false }: { words: string[]; reverse?: boolean }) {
  return (
    <div className="overflow-hidden border-y border-primary/20 py-4">
      <ul className={`flex w-max gap-3 ${reverse ? "voices-chip-marquee-right" : "voices-chip-marquee-left"}`}>
        {[...words, ...words].map((word, index) => (
          <li key={`${word}-${index}`} aria-hidden={index >= words.length} className="whitespace-nowrap rounded-full border border-primary/[0.22] px-4 py-1.5 text-[10px] tracking-[0.5px] text-primary/40">{word}</li>
        ))}
      </ul>
    </div>
  )
}

export function DoubleMarquee() {
  const half = Math.ceil(WORDS.length / 2)
  return (
    <section aria-label="Words clients use to describe us" className="flex flex-col gap-4 bg-[#0a0806] py-16">
      <MarqueeRow words={[...WORDS.slice(0, half), ...WORDS.slice(0, half)]} reverse />
      <MarqueeRow words={[...WORDS.slice(half), ...WORDS.slice(half)]} />
    </section>
  )
}

function VoiceCard({ voice, mauve }: { voice: ApprovedVoice; mauve: boolean }) {
  return (
    <article className={`flex h-full w-[min(80vw,400px)] flex-shrink-0 flex-col rounded-r-[10px] border-l-2 bg-[rgba(181,82,10,0.03)] p-7 ${mauve ? "border-mauve" : "border-primary"}`}>
      <blockquote className="font-serif text-[17px] font-normal leading-[1.65] text-white/[0.88]">{voice.quote}</blockquote>
      <div className="mt-auto pt-8">
        <div className="flex items-center gap-3">
          {voice.logo_url ? (
            <img src={voice.logo_url} alt={`${voice.company || voice.name} logo`} className="h-10 w-10 flex-shrink-0 rounded-full border border-white/15 bg-white object-contain p-1" />
          ) : (
            <div aria-hidden="true" className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${mauve ? "border-mauve/40 bg-mauve/10 text-mauve" : "border-primary/30 bg-primary/10 text-primary"}`}>{initials(voice.name)}</div>
          )}
          <div>
            <p className="text-sm font-medium text-white">{voice.name}</p>
            {(voice.company || voice.role) && <p className="text-xs text-white/50">{voice.company}{voice.company && voice.role ? " · " : ""}{voice.role}</p>}
          </div>
        </div>
        {voice.words.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-2" aria-label="Words used">
            {voice.words.map((word) => <li key={word} className={`rounded-full border px-2.5 py-1 text-[10px] tracking-[0.5px] ${mauve ? "border-mauve/40 text-mauve" : "border-primary/30 text-primary/70"}`}>{word}</li>)}
          </ul>
        )}
      </div>
    </article>
  )
}

export function HorizontalVoices({ voices }: { voices: ApprovedVoice[] }) {
  const [ref, progress] = useScrollProgress<HTMLElement>()
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
    return <p className="bg-[#0a0806] px-6 py-24 text-center font-serif text-lg text-white/50">No voices yet. Be the first to share yours.</p>
  }

  const current = Math.min(voices.length, Math.floor(progress * voices.length) + 1)

  return (
    <section ref={ref} aria-label="All voices" className="relative min-h-[200vh] bg-[#0a0806]">
      <div className="sticky top-0 flex h-svh flex-col justify-center gap-10 overflow-hidden py-12">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6">
          <p className="text-[9px] font-semibold uppercase tracking-[5px] text-primary">All voices</p>
          <p className="font-serif text-sm text-white/50" aria-live="polite"><span style={{ color: HEADLINE }}>{current}</span> / {voices.length}</p>
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

export function GiantCounter({ count }: { count: number }) {
  const [ref, visible] = useInView<HTMLElement>()
  return (
    <section ref={ref} data-visible={visible} className="voices-counter flex flex-col items-center bg-[#0a0806] px-6 py-32 text-center">
      <p className="voices-counter-number font-serif text-[120px] font-normal leading-none">{count}</p>
      <p className="voices-counter-label mt-4 text-[8px] uppercase tracking-[3px] text-white/40">Voices &amp; counting</p>
      <p className="voices-counter-phrase mt-6 font-serif text-lg italic text-white/55">People we&apos;ve had the privilege of creating with.</p>
    </section>
  )
}
