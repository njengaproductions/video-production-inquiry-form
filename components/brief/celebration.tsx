"use client"

// Palette drawn only from globals.css brand tokens:
// --brand, --mauve, --green, --brand-light, --mauve-bg
const COLORS = ["#B5520A", "#957D7D", "#2C5F2E", "#FDF0E8", "#F6F2F2"]

// 18 confetti pieces with deterministic-ish spread so the burst looks full but light.
const PIECES = Array.from({ length: 18 }, (_, i) => {
  const angle = (i / 18) * Math.PI * 2
  const spread = 60 + (i % 5) * 26
  return {
    id: i,
    dx: `${Math.round(Math.cos(angle) * spread)}px`,
    rot: `${(i % 2 === 0 ? 1 : -1) * (180 + i * 22)}deg`,
    left: `${46 + (i % 7) * 1.2}%`,
    delay: `${(i % 6) * 0.04}s`,
    color: COLORS[i % COLORS.length],
    size: i % 3 === 0 ? 10 : 7,
  }
})

export function Celebration() {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center" aria-hidden>
      <div className="brief-check-pop flex h-20 w-20 items-center justify-center rounded-full bg-brand shadow-xl">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <div className="absolute left-1/2 top-1/2">
        {PIECES.map((p) => (
          <span
            key={p.id}
            className="brief-confetti-piece absolute block rounded-[2px]"
            style={{
              left: p.left,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              animationDelay: p.delay,
              // custom props consumed by the confetti-fall keyframe
              ["--dx" as string]: p.dx,
              ["--rot" as string]: p.rot,
            }}
          />
        ))}
      </div>
    </div>
  )
}
