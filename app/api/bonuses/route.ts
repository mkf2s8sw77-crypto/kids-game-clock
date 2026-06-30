import { NextRequest, NextResponse } from "next/server";
import { createBonus, deleteBonus, listBonuses } from "@/lib/db/queries";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const week = url.searchParams.get("week");
  return NextResponse.json(listBonuses(week ?? undefined));
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    weekStartDate: string;
    minutes: number;
    reason: string;
  };
  if (!body.weekStartDate || !Number.isFinite(body.minutes)) {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
  }
  try {
    const r = createBonus({ weekStartDate: body.weekStartDate, minutes: body.minutes, reason: body.reason ?? "" });
    return NextResponse.json(r);
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const id = Number(url.searchParams.get("id"));
  if (!Number.isFinite(id)) return NextResponse.json({ error: "BAD_ID" }, { status: 400 });
  deleteBonus(id);
  return NextResponse.json({ ok: true });
}
