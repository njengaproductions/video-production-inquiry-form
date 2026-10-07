import type { ReactNode } from "react"

export default function VoicesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="voices-root min-h-screen" style={{ backgroundColor: "#0a0806" }}>
      {children}
    </div>
  )
}
