import { NextResponse } from "next/server"
import { getByTrackerId } from "@/lib/briefs"
import { isAdmin } from "@/auth"

export const dynamic = "force-dynamic"

// In-memory, per-instance limiter: 20 requests per IP per 60s window.
const LIMIT = 20
const WINDOW_MS = 60_000
const rateMap = new Map<string, { count: number; reset: number }>()

function allow(ip: string): boolean {
  const now = Date.now()
  const entry = rateMap.get(ip)
  if (!entry || now > entry.reset) {
    rateMap.set(ip, { count: 1, reset: now + WINDOW_MS })
    return true
  }
  if (entry.count >= LIMIT) return false
  entry.count++
  return true
}

function decodeHeader(value: string | null): string | null {
  if (!value) return null
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

// Vercel injects these geo headers on every deployed request; absent in local dev.
function geoLocation(req: Request): string | null {
  const city = decodeHeader(req.headers.get("x-vercel-ip-city"))
  const region = decodeHeader(req.headers.get("x-vercel-ip-country-region"))
  return [city, region].filter(Boolean).join(", ") || null
}

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  if (!allow(ip)) return NextResponse.json({ error: "too_many_requests" }, { status: 429 })
  const { code } = await params
  const viewerIsAdmin = await isAdmin().catch(() => false)
  const data = await getByTrackerId(code, req.headers.get("user-agent"), !viewerIsAdmin, geoLocation(req))
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 })
  const tracker_stages = data.tracker_stages.map((stage) => {
    const noteVisible = stage.noteVisible ?? false
    return {
      key: stage.key,
      label: stage.label,
      done: stage.done,
      date: stage.date ?? null,
      note: noteVisible ? stage.note ?? null : null,
      noteVisible,
    }
  })
  return NextResponse.json({ ...data, tracker_stages }, { headers: { "Cache-Control": "no-store" } })
}
