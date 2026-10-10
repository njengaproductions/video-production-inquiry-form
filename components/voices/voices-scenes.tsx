"use client"

import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { useLenis } from "lenis/react"
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react"
import { useExitProgress, useScrollProgress } from "./use-scroll-progress"
import { logoImageStyle } from "@/lib/logo-display"
import type { ApprovedVoice } from "./voices-form"

export const HEADLINE = "#f0ece6"

export const WORDS = ["Cinematic", "Showed up", "Exceeded expectations", "Changed the game", "Professional", "Creative", "Fast turnaround", "On brand", "Storytelling", "Legendary", "Detail-oriented", "Easy to work with", "Prepared", "Communicative", "High quality", "Would refer", "Already referred", "Understood the vision"]

const FORM_ID = "add-your-voice"

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const

export function reveal(delay = 0) {
  return {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: EASE_OUT_EXPO, delay },
    viewport: { once: true, margin: "-60px" },
  }
}

/** Above-the-fold variant: animates on mount so hydration never hides content waiting on an in-view check. */
function mountReveal(delay = 0) {
  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, ease: EASE_OUT_EXPO, delay },
  }
}

// Transformed wrappers form their own stacking context, so they must keep the layer of the element they wrap.
const ABOVE_OVERLAYS = { position: "relative", zIndex: 10 } as const

/** Opaque, stacked scene that casts a soft shadow upward as it slides over the previous one. */
export const SCENE_EDGE = "relative bg-[#0a0806]"

function initials(name: string) {
  const skip = new Set(["and", "or", "&", "the", "a"])
  const words = name.split(/\s+/).filter((w) => w && !skip.has(w.toLowerCase()))
  if (words.length === 0) return ""
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
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

const HERO_LINES = [
  { words: ["Words", "from"], color: HEADLINE },
  { words: ["the", "people"], color: "#B15927" },
  { words: ["we", "create", "with."], color: HEADLINE },
]
function HeroHeadline() {
  return (
    <h1 className="relative text-center font-serif text-[38px] font-normal leading-[1.1] md:text-[52px]"
      style={{ color: HEADLINE, textShadow: "0 2px 24px rgba(10,8,6,0.85), 0 1px 6px rgba(10,8,6,0.65)" }}
    >
      {HERO_LINES.map((line) => (
        <span key={line.words.join(" ")} className="block" style={{ color: line.color }}>
          {line.words.join(" ")}
        </span>
      ))}
    </h1>
  )
}

type PhotoLayer = {
  src: string
  x: number
  y: number
  w: number
  h: number
  jitterX: number
  jitterY: number
  rotation: number
  dirY: 1 | -1
  dirX: 1 | -1
  speedY: number
  speedX: number
  delay: number
}

// [x, y, w, h] in viewport % — zones intentionally bleed off-screen.
const COLLAGE_ZONES: [number, number, number, number][] = [
  [-8, -5, 52, 38], [52, -8, 56, 42], [-6, 32, 48, 36],
  [54, 30, 54, 40], [10, 62, 50, 38], [52, 65, 52, 36],
]

const rand = (min: number, max: number) => min + Math.random() * (max - min)

function buildPhotoLayers(photos: string[]): PhotoLayer[] {
  const zones = [...COLLAGE_ZONES].sort(() => Math.random() - 0.5)
  return zones.map(([x, y, w, h], index) => ({
    src: photos[index % photos.length],
    x,
    y,
    w,
    h,
    jitterX: rand(-12, 12),
    jitterY: rand(-10, 10),
    rotation: rand(-2.5, 2.5),
    dirY: Math.random() < 0.5 ? 1 : -1,
    dirX: x + w / 2 < 50 ? 1 : -1,
    // 25–65px expressed against a ~900px-tall viewport so drift scales with screen height.
    speedY: rand(25, 65) / 9,
    speedX: rand(8, 22),
    delay: 200 + index * 150,
  }))
}

function GhostPhotos({ photos, progress }: { photos: string[]; progress: number }) {
  const [layers, setLayers] = useState<PhotoLayer[] | null>(null)

  // Randomized after mount so server and client markup match.
  useEffect(() => {
    if (photos.length) setLayers(buildPhotoLayers(photos))
  }, [photos])

  if (!layers) return null
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1]">
      {layers.map((layer, index) => (
        <div
          key={index}
          className="voices-ghost absolute overflow-hidden will-change-transform"
          style={{
            left: `calc(${layer.x}vw + ${layer.jitterX}px)`,
            top: `calc(${layer.y}vh + ${layer.jitterY}px)`,
            width: `${layer.w}vw`,
            height: `${layer.h}vh`,
            animationDelay: `${layer.delay}ms`,
            transform: `rotate(${layer.rotation}deg) translateY(${layer.dirY * layer.speedY * progress}vh) translateX(${layer.dirX * layer.speedX * progress}px)`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={layer.src} alt="" decoding="async" className="size-full select-none object-cover" style={{ filter: "saturate(0.72) brightness(0.70)" }} />
        </div>
      ))}
    </div>
  )
}

export function VoicesHero({ count, photos = [] }: { count: number; photos?: string[] }) {
  const [heroRef, progress] = useExitProgress<HTMLElement>()
  const leakProgress = Math.max(0, Math.min(1, (progress - 0.35) / 0.4))
  const leakOpacity = Math.sin(leakProgress * Math.PI) * 0.85

  return (
    <section ref={heroRef} className={`${SCENE_EDGE} z-[60] flex min-h-screen flex-col overflow-hidden bg-[#0a0806] px-6`}>
      <GhostPhotos photos={photos} progress={progress} />
      <div aria-hidden="true" className="voices-hero-vignette pointer-events-none absolute inset-0 z-[3]" />
      <div aria-hidden="true" className="voices-hero-amber pointer-events-none absolute inset-0 z-[4]" />
      <div aria-hidden="true" className="voices-grain pointer-events-none absolute inset-0 z-[6]" />
      <div
        aria-hidden="true"
        className="voices-light-leak pointer-events-none absolute inset-0 z-[5]"
        style={{ opacity: leakOpacity, transform: `rotate(-12deg) translateY(${20 + progress * 20}%)` }}
      />
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

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 items-center justify-center py-16">
        <span aria-hidden="true" className="pointer-events-none absolute z-[6] select-none font-serif text-[clamp(96px,20vw,180px)] font-normal leading-none tracking-[0.04em] text-[rgba(181,82,10,0.03)]" style={{ transform: `translateY(${-progress * 1.8}vh)` }}>VOICES</span>
        <div className="relative" style={{ transform: `translateY(${-progress * 3.2}vh)` }}>
          <motion.div {...mountReveal()}>
            <HeroHeadline />
          </motion.div>
        </div>
      </div>

      <motion.div {...mountReveal(0.1)} style={ABOVE_OVERLAYS}>
      <div className="relative z-10 mx-auto flex w-full max-w-6xl items-end justify-between gap-6 pb-8" style={{ transform: `translateY(${progress * 2.4}vh)` }}>
        <p className="max-w-[10rem] text-[9px] font-semibold uppercase tracking-[5px] text-primary">The voices behind the work</p>
        <div className="text-right">
          <p className="font-serif text-[52px] font-normal leading-none text-[rgba(181,82,10,0.35)]">{count}</p>
          <p className="mt-2 text-[8px] uppercase tracking-[3px] text-[rgba(240,236,230,0.62)]">Voices &amp; counting</p>
        </div>
        <div aria-hidden="true" className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 sm:flex">
          <span className="voices-scroll-label text-[8px] uppercase tracking-[3px] text-[rgba(240,236,230,0.62)]">Scroll to explore</span>
          <span className="voices-scroll-cue block h-8 w-px bg-primary/40" />
        </div>
      </div>
      </motion.div>
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
    <section ref={ref} aria-label="Featured voice" className={`${SCENE_EDGE} z-50 -mt-[calc(100vh+4px)] h-[calc(340vh+4px)] bg-[#0a0806]`}>
      <div className="sticky bg-[#0a0806] top-0 flex h-screen items-center justify-center overflow-hidden px-6">
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
              <div className="flex items-center justify-center gap-3">
              {voice.logo_url && (
                <img src={voice.logo_url} alt={voice.company || voice.name} className="h-8 w-8 rounded-full border border-white/20" style={logoImageStyle(voice.logo_display)} />
              )}
              <p className="text-sm font-medium text-[#f0ece6]">{voice.name}</p>
            </div>
              {(voice.company || voice.role) && <p className="mt-1 text-xs text-[rgba(240,236,230,0.62)]">{voice.company}{voice.company && voice.role ? " · " : ""}{voice.role}</p>}
            </figcaption>
          )}
        </figure>
      </div>
    </section>
  )
}

const VOICE_COLORS = ["#e07b3a", "#c9a96e", "#8ab4a0", "#a07cb0", "#6fa8c9", "#d08a8a", "#b8b06a", "#7c9fd0"]

// Spread-fix order: the most-chosen words sit at every 3rd index (~60° apart)
// so high-count chips don't cluster on one side of the ring.
const WORDS_BASE = [
  "Storytelling", "Cinematic", "Legendary",
  "Professional", "Easy to work with", "Showed up",
  "Exceeded expectations", "Fast turnaround", "Detail-oriented",
  "On brand", "Would refer", "Communicative",
  "Creative", "High quality", "Prepared",
  "Changed the game", "Understood the vision", "Already referred",
]

type BurstVoice = ApprovedVoice & { color: string }

type WordNode = {
  word: string
  count: number
  angle: number
  reach: number
  delay: number
  color: string
  borderColor: string
  fontSize: number
  padV: number
  padH: number
  glow: string
}

type AvatarDatum = {
  voice: BurstVoice
  centroidAngle: number
  avatarReach: number
  myNodes: WordNode[]
}

function hexToRgb(hex: string) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  }
}

function useRotatedWords() {
  const [rotated, setRotated] = useState<string[]>([])
  useEffect(() => {
    const offset = Math.floor(Math.random() * WORDS_BASE.length)
    setRotated([...WORDS_BASE.slice(offset), ...WORDS_BASE.slice(0, offset)])
  }, [])
  return rotated
}

// One chip per unique word, sized by how many voices chose it. Single-owner
// chips take that voice's color; shared chips go warm neutral and let the
// thread lines carry the color story.
function buildWordNodes(rotated: string[], voices: BurstVoice[]): WordNode[] {
  const countMap = new Map<string, number>()
  const ownerMap = new Map<string, BurstVoice>()
  for (const v of voices) {
    for (const w of v.words) {
      countMap.set(w, (countMap.get(w) ?? 0) + 1)
      if (!ownerMap.has(w)) ownerMap.set(w, v)
    }
  }
  return rotated.flatMap((word, index) => {
    const count = countMap.get(word) ?? 0
    if (count === 0) return []
    const isSingle = count === 1
    const owner = ownerMap.get(word)!
    let glow = "none"
    if (count >= 5) glow = "0 0 12px rgba(240,236,230,0.14), 0 0 28px rgba(240,236,230,0.06)"
    else if (count >= 4) glow = "0 0 7px rgba(240,236,230,0.09)"
    return [{
      word,
      count,
      angle: (index / rotated.length) * Math.PI * 2 - Math.PI / 2 + (index % 2 ? 0.18 : -0.08),
      reach: index % 3 === 0 ? 1 : index % 3 === 1 ? 0.72 : 0.86,
      delay: (index % 4) * 0.08,
      color: isSingle ? owner.color : "rgba(240,236,230,0.82)",
      borderColor: isSingle ? owner.color + "45" : "rgba(240,236,230,0.16)",
      fontSize: 8.5 + (count - 1) * 1.1,
      padV: 3 + (count - 1) * 0.5,
      padH: 8 + (count - 1) * 1.7,
      glow,
    }]
  })
}

// Avatar sits at the circular mean of its words' angles, pulled inside the
// word ring, then nudged apart so no two avatars overlap angularly.
function buildAvatarData(
  wordNodes: WordNode[],
  voices: BurstVoice[],
  jitter: Array<{ angle: number; reach: number }>,
): AvatarDatum[] {
  const nodeByWord = new Map(wordNodes.map(n => [n.word, n]))
  const raw: AvatarDatum[] = voices.flatMap((voice, i) => {
    const myNodes = voice.words.filter(w => nodeByWord.has(w)).map(w => nodeByWord.get(w)!)
    if (!myNodes.length) return []
    let sinSum = 0, cosSum = 0, reachSum = 0, minReach = Infinity
    for (const n of myNodes) {
      sinSum += Math.sin(n.angle)
      cosSum += Math.cos(n.angle)
      reachSum += n.reach
      if (n.reach < minReach) minReach = n.reach
    }
    const nn = myNodes.length
    const j = jitter[i] ?? { angle: 0, reach: 0 }
    return [{
      voice,
      centroidAngle: Math.atan2(sinSum / nn, cosSum / nn) + j.angle,
      avatarReach: Math.min((reachSum / nn) * 0.85, minReach * 0.8) + j.reach,
      myNodes,
    }]
  })
  for (let iter = 0; iter < 8; iter++) {
    for (let a = 0; a < raw.length; a++) {
      for (let b = a + 1; b < raw.length; b++) {
        let diff = raw[b].centroidAngle - raw[a].centroidAngle
        while (diff > Math.PI) diff -= 2 * Math.PI
        while (diff < -Math.PI) diff += 2 * Math.PI
        if (Math.abs(diff) < 0.32 && Math.abs(diff) > 0.001) {
          const push = (0.32 - Math.abs(diff)) / 2
          if (diff > 0) { raw[a].centroidAngle -= push; raw[b].centroidAngle += push }
          else { raw[a].centroidAngle += push; raw[b].centroidAngle -= push }
        }
      }
    }
  }
  return raw
}

const localProgress = (burst: number, delay: number) =>
  Math.min(1, Math.max(0, (burst - delay) / (1 - delay)))

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

const QUOTE_CARD_W = 260
const QUOTE_CARD_H = 180
const QUOTE_CARD_PAD = 12

function BurstQuoteCard({
  voice,
  anchor,
  stage,
  onClose,
}: {
  voice: BurstVoice
  anchor: { x: number; y: number }
  stage: { w: number; h: number }
  onClose: () => void
}) {
  const { r, g, b } = hexToRgb(voice.color)
  const width = Math.min(QUOTE_CARD_W, stage.w - QUOTE_CARD_PAD * 2)
  const left = Math.min(Math.max(anchor.x - width / 2, QUOTE_CARD_PAD), stage.w - width - QUOTE_CARD_PAD)
  const top = Math.min(
    Math.max(anchor.y - QUOTE_CARD_H - 24, QUOTE_CARD_PAD),
    stage.h - QUOTE_CARD_H - QUOTE_CARD_PAD,
  )
  return (
    <div
      role="dialog"
      aria-label={`${voice.name}'s testimonial`}
      onClick={e => e.stopPropagation()}
      className="absolute z-30 rounded-[10px] border border-white/10 bg-[#111009] px-4 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.7)]"
      style={{ left, top, width }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close testimonial"
        className="absolute right-2.5 top-2 px-1 py-0.5 text-sm leading-none text-white/30 transition-colors hover:text-white/70"
      >
        {"×"}
      </button>
      <p className="mb-0.5 pr-5 text-[11px] font-light" style={{ color: voice.color }}>{voice.name}</p>
      {voice.company && (
        <p className="mb-2.5 text-[9px] uppercase tracking-[0.06em] text-white/35">{voice.company}</p>
      )}
      <p className="font-serif text-[12.5px] font-light italic leading-relaxed" style={{ color: "rgba(240,236,230,0.82)" }}>
        {`"${voice.quote}"`}
      </p>
      <ul className="mt-2.5 flex flex-wrap gap-1">
        {voice.words.slice(0, 6).map(w => (
          <li
            key={w}
            className="rounded-full px-2 py-0.5 text-[8.5px] font-extralight tracking-[0.04em]"
            style={{ border: `1px solid rgba(${r},${g},${b},0.35)`, color: `rgba(${r},${g},${b},0.85)` }}
          >
            {w}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ChipBurst({ voices = [] }: { voices?: ApprovedVoice[] }) {
  const [ref, progress] = useScrollProgress<HTMLElement>(1)
  const burst = Math.sin(Math.PI * progress)
  const stickyRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ w: 0, h: 0 })
  useEffect(() => {
    if (!stickyRef.current) return
    const ro = new ResizeObserver(([e]) => setDims({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(stickyRef.current)
    return () => ro.disconnect()
  }, [])
  const isMobile = dims.w < 520
  const HW = Math.min(dims.w * (isMobile ? 0.36 : 0.44), 420)
  const HH = Math.min(dims.h * (isMobile ? 0.44 : 0.37), 305)
  const avatarInnerScale = isMobile ? 0.58 : 1.0

  const rotated = useRotatedWords()
  const { wordNodes, avatarData } = useMemo(() => {
    if (!rotated.length) return { wordNodes: [], avatarData: [] }
    const colored = voices.map((v, i) => ({ ...v, color: VOICE_COLORS[i % VOICE_COLORS.length] }))
    const wn = buildWordNodes(rotated, colored)
    const jitter = colored.map(() => ({ angle: (Math.random() - 0.5) * 0.26, reach: Math.random() * 0.07 }))
    return { wordNodes: wn, avatarData: buildAvatarData(wn, colored, jitter) }
  }, [rotated, voices])

  const [activeVoice, setActiveVoice] = useState<BurstVoice | null>(null)
  const [hoveredVoice, setHoveredVoice] = useState<BurstVoice | null>(null)
  useEffect(() => {
    if (burst < 0.2) {
      setActiveVoice(null)
      setHoveredVoice(null)
    }
  }, [burst])

  const introOpacity = Math.max(0, 1 - burst / 0.22)
  const headlineOpacity = clamp01((burst - 0.28) / 0.2) * clamp01(1 - (burst - 0.72) / 0.28)
  const legendOpacity = clamp01((burst - 0.32) / 0.25) * 0.55
  const avatarOpacity = clamp01((burst - 0.12) / 0.3)
  const ready = dims.w > 0

  const activeAvatar = activeVoice ? avatarData.find(a => a.voice.id === activeVoice.id) : undefined
  const activeAnchor = activeAvatar
    ? {
        x: dims.w / 2 + Math.cos(activeAvatar.centroidAngle) * activeAvatar.avatarReach * avatarInnerScale * burst * HW,
        y: dims.h / 2 + Math.sin(activeAvatar.centroidAngle) * activeAvatar.avatarReach * avatarInnerScale * burst * HH,
      }
    : null

  return (
    <section ref={ref} aria-label="Words clients use to describe us" className={`${SCENE_EDGE} z-40 -mt-[calc(100vh+4px)] h-[calc(300vh+4px)] bg-[#0a0806]`}>
      <div
        ref={stickyRef}
        className="sticky top-0 h-screen overflow-hidden bg-[#0a0806]"
        onClick={() => setActiveVoice(null)}
      >
        {ready && (
          <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
            {avatarData.map(({ voice, centroidAngle, avatarReach, myNodes }) => {
              const ax = dims.w / 2 + Math.cos(centroidAngle) * avatarReach * avatarInnerScale * burst * HW
              const ay = dims.h / 2 + Math.sin(centroidAngle) * avatarReach * avatarInnerScale * burst * HH
              return myNodes.map(node => {
                const local = localProgress(burst, node.delay)
                const threadOpacity = 0.22 * burst * local
                if (threadOpacity < 0.01) return null
                return (
                  <line
                    key={`${voice.id}-${node.word}`}
                    x1={ax}
                    y1={ay}
                    x2={dims.w / 2 + Math.cos(node.angle) * node.reach * local * HW}
                    y2={dims.h / 2 + Math.sin(node.angle) * node.reach * local * HH}
                    stroke={voice.color}
                    strokeOpacity={threadOpacity}
                    strokeWidth={0.5}
                  />
                )
              })
            })}
          </svg>
        )}

        {ready && (
          <ul className="pointer-events-none absolute inset-0">
            {wordNodes.map(node => {
              const local = localProgress(burst, node.delay)
              return (
                <li
                  key={node.word}
                  className="absolute left-1/2 top-1/2 whitespace-nowrap rounded-full bg-[#0a0806] font-extralight tracking-[0.045em] will-change-transform"
                  style={{
                    opacity: local * Math.min(1, 0.48 + node.count * 0.1),
                    transform: `translate(-50%,-50%) translate(${Math.cos(node.angle) * node.reach * local * HW}px, ${Math.sin(node.angle) * node.reach * local * HH}px) scale(${0.62 + local * 0.38})`,
                    border: `1px solid ${node.borderColor}`,
                    boxShadow: node.glow,
                    color: node.color,
                    fontSize: node.fontSize,
                    padding: `${node.padV}px ${node.padH}px`,
                  }}
                >
                  {node.word}
                </li>
              )
            })}
          </ul>
        )}

        {ready && (
          <ul className="absolute inset-0" style={{ pointerEvents: "none" }}>
            {avatarData.map(({ voice, centroidAngle, avatarReach }) => {
              const { r, g, b } = hexToRgb(voice.color)
              const isActive = activeVoice?.id === voice.id
              return (
                <li
                  key={voice.id}
                  className="absolute left-1/2 top-1/2 z-[15] flex select-none items-center will-change-transform"
                  style={{
                    opacity: avatarOpacity,
                    transform: `translate(-50%,-50%) translate(${Math.cos(centroidAngle) * avatarReach * avatarInnerScale * burst * HW}px, ${Math.sin(centroidAngle) * avatarReach * avatarInnerScale * burst * HH}px)`,
                  }}
                >
                  <button
                    type="button"
                    aria-label={`Read ${voice.name}'s testimonial`}
                    aria-pressed={isActive}
                    tabIndex={avatarOpacity > 0.5 ? 0 : -1}
                    onClick={e => {
                      e.stopPropagation()
                      setActiveVoice(prev => (prev?.id === voice.id ? null : voice))
                    }}
                    onMouseEnter={() => {
                      if (burst > 0.22) setHoveredVoice(voice)
                    }}
                    onMouseLeave={() => setHoveredVoice(prev => (prev?.id === voice.id ? null : prev))}
                    onFocus={() => {
                      if (burst > 0.22) setHoveredVoice(voice)
                    }}
                    onBlur={() => setHoveredVoice(prev => (prev?.id === voice.id ? null : prev))}
                    className="flex h-[44px] w-[44px] items-center justify-center rounded-full transition-[filter,transform] duration-200 hover:scale-[1.08] hover:brightness-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:h-[44px] sm:w-[44px]"
                    style={{
                      pointerEvents: avatarOpacity > 0.5 ? "auto" : "none",
                      outlineColor: voice.color,
                    }}
                  >
                    <div
                      className="avatar-btn-inner flex h-[44px] w-[44px] items-center justify-center overflow-hidden rounded-full text-[9.5px] tracking-[0.05em] max-[520px]:h-[36px] max-[520px]:w-[36px]"
                      style={{
                        border: `1.5px solid ${voice.color}`,
                        background: `rgba(${r},${g},${b},0.1)`,
                        boxShadow: `0 0 0 3px rgba(${r},${g},${b},${isActive ? 0.35 : 0.14})`,
                        color: voice.color,
                      }}
                    >
                      {voice.logo_url ? (
                        <img src={voice.logo_url} alt="" className="h-full w-full rounded-full" style={logoImageStyle(voice.logo_display)} />
                      ) : (
                        initials(voice.name)
                      )}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-7 z-[16]" aria-live="polite">
          <AnimatePresence>
            {hoveredVoice && (
              <motion.div
                key={hoveredVoice.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.18 }}
                className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-0.5 text-center"
              >
                <span className="font-serif text-base font-light tracking-[0.01em] text-[#f0ece6]">{hoveredVoice.name}</span>
                {hoveredVoice.company && (
                  <span className="text-[0.72rem] font-extralight uppercase tracking-[0.06em] text-[#a89880]">
                    {hoveredVoice.company}
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div
          className="pointer-events-none absolute inset-0 z-[6] flex flex-col items-center justify-center gap-4 px-7 text-center"
          style={{ opacity: introOpacity }}
          aria-hidden={introOpacity === 0}
        >
          <h2 className="font-serif text-[clamp(22px,4vw,36px)] font-light leading-tight" style={{ color: "rgba(240,236,230,0.9)" }}>
            What our clients <em className="not-italic text-primary">say.</em>
          </h2>
          <p className="max-w-[340px] text-[clamp(11px,1.5vw,13px)] font-extralight leading-relaxed" style={{ color: "rgba(240,236,230,0.42)" }}>
            We asked each client to choose the words that best described their experience working with us.
          </p>
          <p className="mt-0.5 text-[9px] uppercase tracking-[0.1em]" style={{ color: "rgba(240,236,230,0.22)" }}>
            {"↓ Scroll to reveal"}
          </p>
        </div>

        <p
          className="pointer-events-none absolute left-1/2 top-1/2 z-[5] -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap text-center font-serif text-[clamp(17px,3vw,26px)] font-light"
          style={{ color: "rgba(240,236,230,0.9)", opacity: headlineOpacity }}
        >
          In their <span className="text-primary">words.</span>
        </p>

        <p
          className="pointer-events-none absolute bottom-3.5 right-3.5 z-[8] text-right text-[9px] font-extralight leading-[1.9] tracking-[0.04em]"
          style={{ color: "rgba(240,236,230,0.28)", opacity: legendOpacity }}
        >
          {"● Color = client"}<br />
          {"● Size = how many chose it"}<br />
          {"● Tap a circle for their story"}
        </p>

        {activeVoice && activeAnchor && (
          <BurstQuoteCard voice={activeVoice} anchor={activeAnchor} stage={dims} onClose={() => setActiveVoice(null)} />
        )}
      </div>
    </section>
  )
}

function VoiceCard({ voice, mauve, index }: { voice: ApprovedVoice; mauve: boolean; index: number }) {
  const stagger = index * 0.08
  return (
    <article className={`flex h-full w-[min(80vw,400px)] flex-shrink-0 flex-col rounded-r-[10px] border-l-2 bg-[rgba(181,82,10,0.03)] p-7 ${mauve ? "border-mauve" : "border-primary"}`}>
      <motion.div {...reveal(stagger)}>
        <blockquote className="voice-card-quote text-[17px] text-[#f0ece6]">{voice.quote}</blockquote>
      </motion.div>
      <div className="mt-auto pt-8">
        <motion.div {...reveal(stagger + 0.08)}>
        <div className="flex items-center gap-3">
          {voice.logo_url ? (
            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full">
              <img src={voice.logo_url} alt={`${voice.company || voice.name} logo`} className="size-full" style={logoImageStyle(voice.logo_display)} />
            </div>
          ) : (
            <div aria-hidden="true" className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${mauve ? "border-mauve/40 bg-mauve/10 text-mauve" : "border-primary/30 bg-primary/10 text-primary"}`}>{initials(voice.name)}</div>
          )}
          <div>
            <p className="voice-card-name text-[#f0ece6]">{voice.name}</p>
            {(voice.company || voice.role) && <p className="voice-card-role text-[rgba(240,236,230,0.62)]">{voice.company}{voice.company && voice.role ? " · " : ""}{voice.role}</p>}
          </div>
        </div>
        </motion.div>
        {voice.words.length > 0 && (
          <motion.div {...reveal(stagger + 0.12)}>
            <ul className="mt-5 flex flex-wrap gap-2" aria-label="Words used">
              {voice.words.map((word) => <li key={word} className={`voice-card-tag rounded-full border px-2.5 py-1 text-[10px] ${mauve ? "border-mauve/40 text-mauve" : "border-primary/30 text-primary"}`}>{word}</li>)}
            </ul>
          </motion.div>
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
    return <p className={`${SCENE_EDGE} z-30 bg-[#0a0806] px-6 py-24 text-center font-serif text-lg text-[rgba(240,236,230,0.62)]`}>No voices yet. Be the first to share yours.</p>
  }

  const current = Math.min(voices.length, Math.floor(progress * voices.length) + 1)

  return (
    <section ref={ref} aria-label="All voices" className={`${SCENE_EDGE} z-30 -mt-[calc(100vh+4px)] h-[calc(300vh+4px)] bg-[#0a0806]`}>
      <div className="sticky bg-[#0a0806] top-0 flex h-screen flex-col justify-center gap-10 overflow-hidden py-12">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6">
          <p className="text-[9px] font-semibold uppercase tracking-[5px] text-primary">All voices</p>
          <p className="font-serif text-sm text-[rgba(240,236,230,0.62)]" aria-live="polite"><span style={{ color: HEADLINE }}>{current}</span> / {voices.length}</p>
        </div>
        <div ref={viewportRef} className="mx-auto w-full max-w-6xl px-6">
          <div ref={trackRef} className="flex w-max gap-6 will-change-transform" style={{ transform: `translate3d(${-progress * maxShift}px,0,0)` }}>
            {voices.map((voice, index) => <VoiceCard key={voice.id} voice={voice} index={index} mauve={index % 2 === 1} />)}
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
  const [ref, progress] = useScrollProgress<HTMLElement>(overlap ? 0.5 : -0.6)
  const visible = progress > 0
  return (
    <section ref={ref} data-visible={visible} className={`voices-counter ${SCENE_EDGE} z-20 bg-[#0a0806] ${overlap ? "-mt-[calc(100vh+4px)] h-[calc(200vh+4px)]" : "h-[200vh]"}`}>
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center bg-[#0a0806] px-6 text-center">
        <motion.div {...reveal()}>
          <p className="voices-counter-number font-serif text-[120px] font-normal leading-none">{count}</p>
        </motion.div>
        <motion.div {...reveal(0.08)}>
          <p className="voices-counter-label mt-4 text-[8px] uppercase tracking-[3px] text-[rgba(240,236,230,0.62)]">Voices &amp; counting</p>
          <p className="voices-counter-phrase mt-6 font-serif text-lg italic text-[rgba(240,236,230,0.62)]">People we&apos;ve had the privilege of creating with.</p>
        </motion.div>
      </div>
    </section>
  )
}
