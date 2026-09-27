// app/admin/import/page.tsx
import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { isAdmin } from "@/auth"
import { AdminHeader } from "@/components/admin/admin-header"
import { ImportTool } from "@/components/admin/import-tool"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Import — NJENGA Admin", robots: { index: false, follow: false } }

export default async function ImportPage() {
  if (!(await isAdmin())) redirect("/admin/login")
  return (
    <main className="min-h-screen bg-background">
      <AdminHeader subtitle="Import past briefs" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <Link href="/admin?status=archived" className="font-sans text-[12px] text-muted-foreground underline-offset-4 hover:underline">
          ← Archived briefs
        </Link>
        <h1 className="mt-3 mb-4 font-serif text-[20px] font-bold text-foreground">Import past briefs</h1>
        <ImportTool />
      </div>
    </main>
  )
}
