"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const links = [
  { href: "/admin", label: "Briefs", exact: true },
  { href: "/admin/voices", label: "Voices" },
  { href: "/track", label: "Tracker" },
  { href: "/admin/import", label: "Import" },
]

const base = "border-b-2 px-1 py-2.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
const active = "border-brand font-medium text-white"
const inactive = "border-transparent text-white/50 hover:text-white/80"

export function AdminNav({ pendingVoices, signOutAction }: { pendingVoices: number; signOutAction: () => Promise<void> }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Admin" className="flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-[12px]">
      {links.map((l) => {
        const isActive = l.exact ? pathname === l.href : pathname.startsWith(l.href)
        return (
          <Link
            key={l.href}
            prefetch
            href={l.href}
            aria-current={isActive ? "page" : undefined}
            className={`${base} ${isActive ? active : inactive}`}
          >
            {l.label}
            {l.href === "/admin/voices" && pendingVoices > 0 && (
              <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-foreground">
                {pendingVoices}
              </span>
            )}
          </Link>
        )
      })}
      <Link href="/" target="_blank" rel="noopener" className={`${base} ${inactive}`}>
        View site
      </Link>
      <form action={signOutAction}>
        <button type="submit" className={`${base} ${inactive}`}>
          Sign out
        </button>
      </form>
    </nav>
  )
}
