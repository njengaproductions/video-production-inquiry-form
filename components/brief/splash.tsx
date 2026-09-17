"use client"

import { useEffect, useState } from "react"

const TAGLINE = "Content that builds brands."

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
    const charDelay = 55
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
      {/* Animated film grain overlay */}
      <div
        aria-hidden="true"
        className="splash-grain pointer-events-none absolute inset-[-50%] z-0 opacity-[0.06] mix-blend-screen"
      />

      <div className="relative z-10 flex flex-col items-center">
        <h1 className="splash-logo font-serif text-4xl font-semibold tracking-[0.18em] text-brand sm:text-6xl">
          NJENGA
          <span className="mt-1 block text-lg font-normal tracking-[0.42em] text-brand/90 sm:text-2xl">
            PRODUCTIONS CO.
          </span>
        </h1>

        <p className="mt-6 h-6 font-sans text-base italic text-mauve sm:text-lg" aria-label={TAGLINE}>
          <span aria-hidden="true">{typed}</span>
          {!typingDone && <span className="splash-caret ml-0.5 inline-block">|</span>}
        </p>

        {showButton && (
          <button
            type="button"
            onClick={onStart}
            className="splash-fade-up splash-button-pulse mt-10 rounded-full bg-brand px-8 py-3.5 font-sans text-sm font-semibold tracking-wide text-primary-foreground transition-transform duration-200 hover:scale-105 hover:bg-brand/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-foreground"
          >
            Start Your Project
          </button>
        )}
      </div>
    </main>
  )
}
