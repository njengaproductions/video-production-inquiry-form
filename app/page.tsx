"use client"

import { useState } from "react"
import { ProjectBrief } from "@/components/brief/project-brief"
import { Splash } from "@/components/brief/splash"

export default function Page() {
  const [started, setStarted] = useState(false)

  if (!started) {
    return <Splash onStart={() => setStarted(true)} />
  }

  return <ProjectBrief />
}
