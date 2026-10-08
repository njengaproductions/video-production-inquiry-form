"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Progress (0–1) of scrolling through a tall section whose content is pinned with `position: sticky`.
 * `leadScreens` skips leading viewport heights where the previous section is still sliding off above this pinned frame.
 */
export function useScrollProgress<T extends HTMLElement>(leadScreens = 0) {
  const ref = useRef<T>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const node = ref.current
      if (!node) return
      const rect = node.getBoundingClientRect()
      const lead = window.innerHeight * leadScreens
      const distance = rect.height - window.innerHeight - lead
      const travelled = -rect.top - lead
      const value = distance > 0 ? Math.min(1, Math.max(0, travelled / distance)) : travelled >= 0 ? 1 : 0
      setProgress(Math.round(value * 1000) / 1000)
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    return () => {
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [leadScreens])

  return [ref, progress] as const
}

/** Progress (0–1) of a normal-height section scrolling up out of the viewport: 0 at its resting top, 1 once fully above. */
export function useExitProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const node = ref.current
      if (!node) return
      const rect = node.getBoundingClientRect()
      const value = rect.height > 0 ? Math.min(1, Math.max(0, -rect.top / rect.height)) : 0
      setProgress(Math.round(value * 1000) / 1000)
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    return () => {
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return [ref, progress] as const
}

export function useInView<T extends HTMLElement>(threshold = 0.35) {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true)
        observer.disconnect()
      }
    }, { threshold })
    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold])

  return [ref, visible] as const
}
