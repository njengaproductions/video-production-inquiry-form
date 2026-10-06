"use client"

import "lenis/dist/lenis.css"
import { ReactLenis } from "lenis/react"
import { useSyncExternalStore } from "react"

const query = "(prefers-reduced-motion: reduce)"

function subscribe(callback: () => void) {
  const media = window.matchMedia(query)
  media.addEventListener("change", callback)
  return () => media.removeEventListener("change", callback)
}

export function SmoothScroll() {
  const reducedMotion = useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => true)
  if (reducedMotion) return null
  return <ReactLenis root options={{ lerp: 0.1, smoothWheel: true }} />
}
