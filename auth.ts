// auth.ts (project root) — Google sign-in, locked to ADMIN_EMAIL.
// Auth.js reads AUTH_SECRET, AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET from Vercel env vars automatically.
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

const ADMIN = (process.env.ADMIN_EMAIL ?? "").toLowerCase().trim()

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 }, // signed out after 8 hours
  pages: { signIn: "/admin/login", error: "/admin/login" },
  callbacks: {
    // LOCK 1: only your verified Google address can finish signing in.
    async signIn({ account, profile }) {
      if (account?.provider !== "google" || !ADMIN) return false
      const email = String(profile?.email ?? "").toLowerCase().trim()
      const verified = (profile as { email_verified?: boolean } | undefined)?.email_verified === true
      return verified && email === ADMIN
    },
  },
})

// LOCK 2: every admin page and data call re-checks this on the server.
export async function isAdmin(): Promise<boolean> {
  if (!ADMIN) return false
  const session = await auth()
  return session?.user?.email?.toLowerCase().trim() === ADMIN
}
