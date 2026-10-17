// components/admin/admin-header.tsx — shared header for all back-office pages (server component).
import Link from "next/link"
import { signOut } from "@/auth"
import { countPendingVoices } from "@/lib/voices"
import { AdminNav } from "@/components/admin/admin-nav"

export async function AdminHeader({ subtitle = "Client briefs" }: { subtitle?: string }) {
  const pendingVoices = await countPendingVoices()
  async function signOutAction() {
    "use server"
    await signOut({ redirectTo: "/admin/login" })
  }
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-foreground px-6 py-4">
      <Link prefetch href="/admin" className="rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand">
        <span className="block font-serif text-lg font-bold tracking-[0.14em] text-brand">NJENGA</span>
        <span className="block font-serif text-[9px] font-light tracking-[6px] text-mauve">PRODUCTIONS CO.</span>
        <span className="mt-1 block text-[11px] text-white/50">{subtitle}</span>
      </Link>
      <AdminNav pendingVoices={pendingVoices} signOutAction={signOutAction} />
    </header>
  )
}
