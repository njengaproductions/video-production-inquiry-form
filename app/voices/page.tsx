import { VoicesForm } from "@/components/voices/voices-form"
import { listApprovedVoices } from "@/lib/voices"
import { MARQUEE_IMAGES } from "@/lib/marquee-images"

export const dynamic = "force-dynamic"

function shuffle<T>(items: T[]) {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[swap]] = [result[swap], result[index]]
  }
  return result
}

export default async function VoicesPage() {
  const voices = await listApprovedVoices()
  return <VoicesForm photos={MARQUEE_IMAGES.slice(0, 3)} testimonials={shuffle(voices.map(({ id, name, company, role, quote, words, logo_url }) => ({ id, name, company, role, quote, words, logo_url })))} />
}

export const metadata = {
  title: "Voices | NJENGA Productions Co.",
  description: "Share your experience with NJENGA Productions Co.",
}
