import { NextResponse } from "next/server"
import { isAdmin } from "@/auth"
import { backfillTrackers } from "@/lib/briefs"

export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const backfilled = await backfillTrackers()
    return NextResponse.json({ backfilled })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Backfill failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
