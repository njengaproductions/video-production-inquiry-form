import { VoicesForm } from "@/components/voices/voices-form"
import { listApprovedVoices, type Voice } from "@/lib/voices"

export const dynamic = "force-dynamic"

export default async function VoicesPage() {
  const voices = await listApprovedVoices()
  return <VoicesForm testimonials={voices.map(({ id, name, company, quote, words, logo_url }) => ({ id, name, company, quote, words, logo_url }))} />
}

export const metadata = {
  title: "Voices | NJENGA Productions Co.",
  description: "Share your experience with NJENGA Productions Co.",
}
