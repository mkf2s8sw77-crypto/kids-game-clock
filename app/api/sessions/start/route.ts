import { NextRequest, NextResponse } from "next/server";
import { startSession } from "@/lib/db/queries";

export const runtime = "nodejs";

export async function POST(_req: NextRequest) {
  try {
    const row = startSession();
    return NextResponse.json(row);
  } catch (e: any) {
    if (e?.message === "ALREADY_ACTIVE") {
      return NextResponse.json({ error: "ALREADY_ACTIVE" }, { status: 400 });
    }
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
