"use client"

// app/page.tsx
// The form stays mounted (just hidden) while the splash is showing,
// so going back via the logo never erases the client's answers.

import { useState } from "react"
import { ProjectBrief } from "@/components/brief/project-brief"
import { Splash } from "@/components/brief/splash"

export default function Page() {
  const [view, setView] = useState<"splash" | "brief">("splash")
  const [everStarted, setEverStarted] = useState(false)
  const [hasProgress, setHasProgress] = useState(false)

  const start = () => {
    setEverStarted(true)
    setView("brief")
    window.scrollTo({ top: 0 })
  }

  const goHome = () => {
    setView("splash")
    window.scrollTo({ top: 0 })
  }

  return (
    <>
      {view === "splash" && <Splash onStart={start} hasProgress={hasProgress} instant={everStarted} />}
      {everStarted && (
        <div hidden={view !== "brief"}>
          <ProjectBrief onHome={goHome} onProgress={setHasProgress} />
        </div>
      )}
    </>
  )
}
