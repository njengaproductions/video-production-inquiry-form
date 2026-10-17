import { NextResponse } from "next/server"
import { getByTrackerId } from "@/lib/briefs"

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

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  if (!allow(ip)) return NextResponse.json({ error: "too_many_requests" }, { status: 429 })
  const { code } = await params
  const data = await getByTrackerId(code)
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 })
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } })
}
