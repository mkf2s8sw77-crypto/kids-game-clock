import { NextRequest, NextResponse } from "next/server";
import { listSessions, manualAddSession } from "@/lib/db/queries";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const childId = url.searchParams.get("childId");
  const week = url.searchParams.get("week");
  const source = url.searchParams.get("source") as "device" | "manual" | null;
  const rows = listSessions({
    childId: childId ? Number(childId) : undefined,
    weekStartDate: week ?? undefined,
    source: source ?? undefined,
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    childId: number;
    startedAt: string;
    endedAt: string;
    note?: string;
  };
  if (!body.childId || !body.startedAt || !body.endedAt) {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
  }
  try {
    const row = manualAddSession({
      childId: body.childId,
      startedAt: body.startedAt,
      endedAt: body.endedAt,
      note: body.note,
    });
    return NextResponse.json(row);
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 400 });
  }
}
