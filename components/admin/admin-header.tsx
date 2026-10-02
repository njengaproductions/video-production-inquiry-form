// components/admin/admin-header.tsx — shared header for all back-office pages (server component).
import Link from "next/link"
import { signOut } from "@/auth"

export function AdminHeader({ subtitle = "Client briefs" }: { subtitle?: string }) {
  return (
    <header className="flex items-center justify-between gap-4 bg-foreground px-6 py-4">
      <Link href="/admin" className="rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand">
        <span className="block font-serif text-lg font-bold text-brand">NJENGA Productions Co.</span>
        <span className="mt-0.5 block text-[11px] text-white/50">{subtitle}</span>
      </Link>
      <nav className="flex items-center gap-4 font-sans text-[12px]">
        <Link href="/admin/voices" className="text-white/70 underline-offset-4 hover:underline">
          Voices
        </Link>
        <Link href="/admin/import" className="text-white/70 underline-offset-4 hover:underline">
          Import
        </Link>
        <Link href="/" className="text-white/70 underline-offset-4 hover:underline">
          View site
        </Link>
        <form
          action={async () => {
            "use server"
            await signOut({ redirectTo: "/admin/login" })
          }}
        >
          <button type="submit" className="text-white/50 underline-offset-4 hover:underline">
            Sign out
          </button>
        </form>
      </nav>
    </header>
  )
}
