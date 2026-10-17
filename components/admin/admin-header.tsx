// components/admin/admin-header.tsx — shared header for all back-office pages (server component).
import Link from "next/link"
import { signOut } from "@/auth"
import { countPendingVoices } from "@/lib/voices"

export async function AdminHeader({ subtitle = "Client briefs" }: { subtitle?: string }) {
  const pendingVoices = await countPendingVoices()
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-foreground px-6 py-4">
      <Link prefetch href="/admin" className="rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand">
        <span className="block font-serif text-lg font-bold tracking-[0.14em] text-brand">NJENGA</span>
        <span className="block font-serif text-[9px] font-light tracking-[6px] text-mauve">PRODUCTIONS CO.</span>
        <span className="mt-1 block text-[11px] text-white/50">{subtitle}</span>
      </Link>
      <nav className="flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-[12px]">
        <Link prefetch href="/admin/voices" className="px-1 py-2.5 text-white/70 underline-offset-4 hover:underline">
          Voices{pendingVoices > 0 && <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-foreground">{pendingVoices}</span>}
        </Link>
        <Link prefetch href="/track" className="px-1 py-2.5 text-white/70 underline-offset-4 hover:underline">
          Tracker
        </Link>
        <Link prefetch href="/admin/import" className="px-1 py-2.5 text-white/70 underline-offset-4 hover:underline">
          Import
        </Link>
        <Link prefetch href="/" className="px-1 py-2.5 text-white/70 underline-offset-4 hover:underline">
          View site
        </Link>
        <form
          action={async () => {
            "use server"
            await signOut({ redirectTo: "/admin/login" })
          }}
        >
          <button type="submit" className="px-1 py-2.5 text-white/50 underline-offset-4 hover:underline">
            Sign out
          </button>
        </form>
      </nav>
    </header>
  )
}
