"use client"

import { useEffect, useState } from "react"

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
]

function MarqueeRow({
  images,
  direction,
}: {
  images: string[]
  direction: "left" | "right"
}) {
  // Duplicate the set so the -50% translate loops seamlessly.
  const doubled = [...images, ...images]
  return (
    <div
      className={`splash-marquee-track gap-3 ${
        direction === "right" ? "splash-marquee-right" : "splash-marquee-left"
      }`}
    >
      {doubled.map((file, i) => (
        <img
          key={`${file}-${i}`}
          src={file}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="h-40 w-auto flex-shrink-0 rounded-lg object-cover sm:h-52"
        />
      ))}
    </div>
  )
}

export function Splash({ onStart }: { onStart: () => void }) {
  const [typed, setTyped] = useState("")
  const [typingDone, setTypingDone] = useState(false)
  const [showButton, setShowButton] = useState(false)

  useEffect(() => {
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
  }, [])

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-foreground px-6 text-center">
      {/* Dual scrolling marquee background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 flex flex-col justify-center gap-3"
      >
        <MarqueeRow images={ROW_1} direction="right" />
        <MarqueeRow images={ROW_2} direction="left" />
      </div>

      {/* Dark overlay keeps the hero text legible over the marquee */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{ backgroundColor: "rgba(26, 26, 26, 0.65)" }}
      />

      {/* Animated film grain overlay */}
      <div
        aria-hidden="true"
        className="splash-grain pointer-events-none absolute inset-[-50%] z-0 opacity-[0.06] mix-blend-screen"
      />

      <div className="relative z-10 flex flex-col items-center">
        <h1 className="splash-logo font-serif text-5xl font-semibold tracking-[0.14em] text-brand sm:text-7xl">
          NJENGA
          <span className="mt-2 block font-serif text-base font-normal tracking-[0.5em] text-mauve sm:text-xl">
            PRODUCTIONS CO.
          </span>
        </h1>

        <div
          aria-hidden="true"
          className="splash-fade-up mt-6 h-px w-56 bg-gradient-to-r from-transparent via-brand to-transparent sm:w-72"
        />

        <p className="mt-6 h-6 font-serif text-base italic text-mauve sm:text-lg" aria-label={TAGLINE}>
          <span aria-hidden="true">{typed}</span>
          {!typingDone && <span className="splash-caret ml-0.5 inline-block">|</span>}
        </p>

        {showButton && (
          <button
            type="button"
            onClick={onStart}
            className="splash-fade-up splash-button-pulse mt-10 rounded-[9999px] bg-brand px-9 py-3.5 font-sans text-sm font-bold tracking-wide text-white transition-transform duration-200 hover:scale-105 hover:bg-brand/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-foreground"
          >
            Start Your Project
          </button>
        )}
      </div>
    </main>
  )
}
