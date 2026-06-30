import { NextRequest, NextResponse } from "next/server";
import { endActiveSession } from "@/lib/db/queries";

export const runtime = "nodejs";

export async function POST(_req: NextRequest) {
  try {
    const r = endActiveSession();
    return NextResponse.json(r);
  } catch (e: any) {
    if (e?.message === "NO_ACTIVE") {
      return NextResponse.json({ error: "NO_ACTIVE" }, { status: 400 });
    }
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
