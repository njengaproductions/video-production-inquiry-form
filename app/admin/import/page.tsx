// app/admin/import/page.tsx
import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { isAdmin } from "@/auth"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminBackdrop } from "@/components/admin/admin-backdrop"
import { ImportTool } from "@/components/admin/import-tool"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Import — NJENGA Admin", robots: { index: false, follow: false } }

export default async function ImportPage() {
  if (!(await isAdmin())) redirect("/admin/login")
  return (
    <main className="relative isolate min-h-screen">
      <AdminBackdrop />
      <AdminHeader subtitle="Import past briefs" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <Link prefetch href="/admin?status=archived" className="font-sans text-[12px] text-white/70 underline-offset-4 hover:underline">
          ← Archived briefs
        </Link>
        <div className="mt-3 rounded-lg border border-hairline bg-surface p-5 shadow-lg shadow-black/30">
          <h1 className="mb-4 font-serif text-[20px] font-bold text-foreground">Import past briefs</h1>
          <ImportTool />
        </div>
      </div>
    </main>
  )
}
