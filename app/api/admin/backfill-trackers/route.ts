import { NextResponse } from "next/server"
import { backfillTrackers } from "@/lib/briefs"

export async function POST() {
  try {
    const backfilled = await backfillTrackers()
    return NextResponse.json({ backfilled })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Backfill failed"
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 })
  }
}
