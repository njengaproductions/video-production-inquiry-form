"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Progress (0–1) of scrolling through a tall section whose content is pinned with `position: sticky`.
 * `overlapScreens` excludes trailing viewport heights where the next section slides over the pinned frame.
 */
export function useScrollProgress<T extends HTMLElement>(overlapScreens = 0) {
  const ref = useRef<T>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const node = ref.current
      if (!node) return
      const rect = node.getBoundingClientRect()
      const distance = rect.height - window.innerHeight * (1 + overlapScreens)
      const value = distance > 0 ? Math.min(1, Math.max(0, -rect.top / distance)) : rect.top <= 0 ? 1 : 0
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
  }, [overlapScreens])

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
