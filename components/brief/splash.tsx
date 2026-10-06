"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"

const TAGLINE = "Content that builds brands."

const ROW_1 = [
  "/images/A.png",
  "/images/B.png",
  "/images/C.png",
  "/images/D.png",
  "/images/E.png",
  "/images/F.png",
  "/images/G.png",
  "/images/H.png",
  "/images/I.png",
  "/images/R.png",
  "/images/S.png",
  "/images/T.png",
  "/images/U.png",
]
const ROW_2 = [
  "/images/J.png",
  "/images/K.png",
  "/images/L.png",
  "/images/M.png",
  "/images/N.png",
  "/images/O.png",
  "/images/P.png",
  "/images/Q.png",
  "/images/V.png",
  "/images/W.png",
  "/images/X.png",
]

// Fisher–Yates shuffle (unbiased). Runs in the browser only, after the first render.
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const ALL_IMAGES = [...ROW_1, ...ROW_2]
const READY_AFTER = 8 // start the motion once this many photos have loaded

function MarqueeRow({
  images,
  direction,
  playing,
  onImageLoad,
  priorityCount = 0,
}: {
  images: string[]
  direction: "left" | "right"
  playing: boolean
  onImageLoad: () => void
  priorityCount?: number
}) {
  // Duplicate the set so the -50% translate loops seamlessly.
  const doubled = [...images, ...images]
  return (
    <div
      className={`splash-marquee-track gap-3 ${
        direction === "right" ? "splash-marquee-right" : "splash-marquee-left"
      }`}
      style={{ willChange: "transform", animationPlayState: playing ? "running" : "paused" }}
    >
      {doubled.map((file, i) => (
        <img
          key={`${file}-${i}`}
          src={file}
          alt=""
          aria-hidden="true"
          loading="eager"
          fetchPriority={i < priorityCount ? "high" : "auto"}
          decoding="async"
          onLoad={i < images.length ? onImageLoad : undefined}
          onError={i < images.length ? onImageLoad : undefined}
          className="h-[41dvh] w-auto flex-shrink-0 rounded-lg object-cover"
        />
      ))}
    </div>
  )
}


export function Splash({
  onStart,
  hasProgress = false,
  instant = false,
}: {
  onStart: () => void
  hasProgress?: boolean // client already has answers → "Continue Your Brief"
  instant?: boolean // returning via the logo → skip the typing intro
}) {
  const [typed, setTyped] = useState(instant ? TAGLINE : "")
  const [typingDone, setTypingDone] = useState(instant)
  const [showButton, setShowButton] = useState(instant)
  const [logoReady, setLogoReady] = useState(instant)
  const [marqueePlaying, setMarqueePlaying] = useState(false)
  // Server renders the default order (so photos start downloading right away);
  // the browser then shuffles while the grid is still faded out.
  const [rows, setRows] = useState<[string[], string[]]>([ROW_1, ROW_2])
  const loadedCount = useRef(0)

  useEffect(() => {
    const mixed = shuffle(ALL_IMAGES)
    setRows([mixed.slice(0, ROW_1.length), mixed.slice(ROW_1.length)])
  }, [])

  const handleImageLoad = () => {
    loadedCount.current += 1
    if (loadedCount.current >= READY_AFTER) setMarqueePlaying(true)
  }

  // Safety net: fade in and start moving even if some photos are slow.
  useEffect(() => {
    const t = setTimeout(() => setMarqueePlaying(true), instant ? 200 : 1500)
    return () => clearTimeout(t)
  }, [instant])

  useEffect(() => {
    if (instant) return
    const timer = setTimeout(() => setLogoReady(true), 700)
    return () => clearTimeout(timer)
  }, [instant])

  useEffect(() => {
    if (instant) return

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (prefersReduced) {
      setTyped(TAGLINE)
      setTypingDone(true)
      setShowButton(true)
      return
    }

    // Start typing after the logo has faded in.
    const startDelay = 900
    const charDelay = 45
    const timers: ReturnType<typeof setTimeout>[] = []

    for (let i = 0; i <= TAGLINE.length; i++) {
      timers.push(
        setTimeout(() => {
          setTyped(TAGLINE.slice(0, i))
          if (i === TAGLINE.length) {
            setTypingDone(true)
            timers.push(setTimeout(() => setShowButton(true), 250))
          }
        }, startDelay + i * charDelay),
      )
    }

    return () => timers.forEach(clearTimeout)
  }, [instant])

  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-foreground px-6 text-center">
      <nav
        aria-label="Site navigation"
        className={`absolute right-5 top-4 z-20 flex items-center gap-3 transition-opacity duration-500 ${logoReady ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <Link prefetch
          href="/voices"
          className="rounded-full border border-brand bg-brand-light px-3 py-1.5 text-xs font-medium text-brand transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          Voices
        </Link>
        <span aria-hidden="true" className="h-4 w-px bg-white/[0.12]" />
        <Link prefetch
          href="/admin"
          rel="nofollow"
          className="rounded-full border border-white/[0.15] bg-transparent px-3 py-1.5 text-xs font-medium text-white/[0.4] transition-colors hover:border-white/30 hover:text-white/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          Admin
        </Link>
      </nav>

      {/* Dual scrolling marquee background */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 z-0 flex flex-col justify-center gap-3 py-[4dvh] transition-opacity duration-700 ease-out ${
          marqueePlaying ? "opacity-100" : "opacity-0"
        }`}
      >
        <MarqueeRow images={rows[0]} direction="right" playing={marqueePlaying} onImageLoad={handleImageLoad} priorityCount={6} />
        <MarqueeRow images={rows[1]} direction="left" playing={marqueePlaying} onImageLoad={handleImageLoad} priorityCount={6} />
      </div>

      {/* Dark overlay keeps the hero text legible over the marquee */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{ backgroundColor: "rgba(26, 26, 26, 0.6)" }}
      />

      {/* Spotlight behind the logo + tagline so they read cleanly over the busy grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[2]"
        style={{
          background:
            "radial-gradient(ellipse 42% 38% at 50% 50%, rgba(26,26,26,0.92) 0%, rgba(26,26,26,0.75) 45%, rgba(26,26,26,0) 100%)",
        }}
      />

      {/* Animated film grain overlay */}
      <div
        aria-hidden="true"
        className="splash-grain pointer-events-none absolute inset-[-50%] z-0 opacity-[0.06] mix-blend-screen"
      />

      <div className="relative z-10 flex flex-col items-center">
        <h1 className="splash-logo font-serif text-5xl font-bold tracking-[0.14em] text-brand sm:text-7xl">
          NJENGA
          <span className="mt-2 block font-serif text-base font-light tracking-[0.5em] text-mauve sm:text-xl">
            PRODUCTIONS CO.
          </span>
        </h1>

        <div
          aria-hidden="true"
          className="splash-fade-up mt-6 h-px w-56 bg-gradient-to-r from-transparent via-brand to-transparent sm:w-72"
        />

        <p
          className="mt-6 h-7 font-serif text-lg italic tracking-wide text-white/90 sm:text-xl"
          style={{ textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}
          aria-label={TAGLINE}
        >
          <span aria-hidden="true">{typed}</span>
          {!typingDone && <span className="splash-caret ml-0.5 inline-block">|</span>}
        </p>

        {showButton && (
          <button
            type="button"
            onClick={onStart}
            className="splash-fade-up splash-button-pulse mt-10 rounded-[9999px] bg-brand px-9 py-3.5 font-sans text-sm font-bold tracking-wide text-white transition-transform duration-200 hover:scale-105 hover:bg-brand/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-foreground"
          >
            {hasProgress ? "Continue Your Brief" : "Start Your Project"}
          </button>
        )}
      </div>
    </main>
  )
}
