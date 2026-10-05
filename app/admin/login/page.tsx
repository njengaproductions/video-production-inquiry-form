// app/admin/login/page.tsx
import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { isAdmin, signIn } from "@/auth"
import { AdminBackdrop } from "@/components/admin/admin-backdrop"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Admin — NJENGA", robots: { index: false, follow: false } }

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await isAdmin()) redirect("/admin")
  const { error } = await searchParams

  return (
    <main className="relative isolate flex min-h-screen flex-col items-center justify-center px-6">
      <AdminBackdrop />
      <div className="w-full max-w-sm rounded-lg bg-surface p-6 text-center shadow-2xl shadow-black/40">
        <p className="font-serif text-lg font-bold text-brand">NJENGA Productions Co.</p>
        <p className="mb-6 mt-1 font-sans text-xs text-muted-foreground">Back office — authorized access only</p>

        {error && (
          <p role="alert" className="mb-4 rounded-md bg-accent p-3 font-sans text-[12px] leading-relaxed text-brand">
            {error === "AccessDenied"
              ? "That Google account isn't authorized for this page."
              : "Sign-in didn't complete. Please try again."}
          </p>
        )}

        <form
          action={async () => {
            "use server"
            await signIn("google", { redirectTo: "/admin" })
          }}
        >
          <button
            type="submit"
            className="w-full rounded-md bg-brand px-5 py-3 font-sans text-[13px] font-semibold text-primary-foreground"
          >
            Sign in with Google
          </button>
        </form>
      </div>

      <Link prefetch
        href="/"
        className="mt-5 font-sans text-[12px] text-white/50 underline-offset-4 hover:text-white/80 hover:underline"
      >
        ← Back to site
      </Link>
    </main>
  )
}
