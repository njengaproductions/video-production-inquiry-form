"use client"

interface MarqueeLogo {
  url: string
  company: string
}

interface TrustedByMarqueeProps {
  logos: MarqueeLogo[]
}

export function TrustedByMarquee({ logos }: TrustedByMarqueeProps) {
  if (!logos.length) return null

  const doubled = [...logos, ...logos]

  return (
    <section aria-labelledby="trusted-by-heading" className="border-y border-white/[0.08] bg-[#111] py-12">
      <p id="trusted-by-heading" className="mb-8 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
        Trusted By
      </p>
      <div
        role="region"
        aria-label="Client logos"
        tabIndex={0}
        className="trusted-by-marquee-viewport overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
        style={{
          maskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
        }}
      >
        <div className="trusted-by-marquee-track flex w-max items-center voices-marquee hover:[animation-play-state:paused] focus-within:[animation-play-state:paused]">
          {doubled.map((logo, index) => (
            <div
              key={`${logo.url}-${index}`}
              aria-hidden={index >= logos.length}
              className="flex h-16 w-auto shrink-0 items-center justify-center px-14"
            >
              <img
                src={logo.url}
                alt={logo.company}
                className="max-h-[44px] max-w-[140px] w-auto object-contain opacity-50 transition-opacity duration-200 hover:opacity-[0.85]"
                style={{ filter: "brightness(0) invert(1)" }}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
