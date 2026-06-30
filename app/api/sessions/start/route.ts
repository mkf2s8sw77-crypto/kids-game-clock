import { NextRequest, NextResponse } from "next/server";
import { startSession } from "@/lib/db/queries";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { childId: number };
  if (!body.childId) {
    return NextResponse.json({ error: "MISSING_CHILD" }, { status: 400 });
  }
  try {
    const row = startSession(body.childId);
    return NextResponse.json(row);
  } catch (e: any) {
    if (e?.message === "ALREADY_ACTIVE") {
      return NextResponse.json({ error: "ALREADY_ACTIVE" }, { status: 400 });
    }
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
