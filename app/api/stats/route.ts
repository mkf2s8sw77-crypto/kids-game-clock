import { NextRequest, NextResponse } from "next/server";
import { getWeekStats } from "@/lib/db/queries";
import { getWeekStartDate } from "@/lib/time";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const week = url.searchParams.get("week") ?? "current";
  const weekStartDate = week === "current" ? undefined : week;
  try {
    const stats = getWeekStats(weekStartDate);
    return NextResponse.json(stats);
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
