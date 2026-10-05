"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

type Phase = "idle" | "loading" | "done"

function isInternalNavigation(event: MouseEvent): boolean {
  if (event.defaultPrevented || event.button !== 0) return false
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false
  const anchor = (event.target as Element | null)?.closest?.("a")
  if (!anchor || !anchor.href || anchor.target === "_blank" || anchor.hasAttribute("download")) return false
  const url = new URL(anchor.href, window.location.href)
  if (url.origin !== window.location.origin) return false
  return url.pathname + url.search !== window.location.pathname + window.location.search
}

export function RouteProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [phase, setPhase] = useState<Phase>("idle")

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (isInternalNavigation(event)) setPhase("loading")
    }
    const onPopState = () => setPhase("loading")
    document.addEventListener("click", onClick, true)
    window.addEventListener("popstate", onPopState)
    return () => {
      document.removeEventListener("click", onClick, true)
      window.removeEventListener("popstate", onPopState)
    }
  }, [])

  useEffect(() => {
    setPhase((current) => (current === "loading" ? "done" : current))
  }, [pathname, searchParams])

  useEffect(() => {
    if (phase !== "done") return
    const timer = setTimeout(() => setPhase("idle"), 350)
    return () => clearTimeout(timer)
  }, [phase])

  // Safety net so the bar never hangs if a navigation is cancelled.
  useEffect(() => {
    if (phase !== "loading") return
    const timer = setTimeout(() => setPhase("done"), 10000)
    return () => clearTimeout(timer)
  }, [phase])

  if (phase === "idle") return null

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[2px]">
      <div className={`route-progress-bar h-full bg-primary ${phase === "done" ? "route-progress-done" : ""}`} />
    </div>
  )
}
