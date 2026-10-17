import { NextResponse } from "next/server"
import { getByTrackerId } from "@/lib/briefs"

export const dynamic = "force-dynamic"

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const data = await getByTrackerId(code)
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 })
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } })
}
