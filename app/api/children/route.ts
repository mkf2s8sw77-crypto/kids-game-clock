import { NextRequest, NextResponse } from "next/server";
import { createChild, deleteChild, listChildren, updateChild } from "@/lib/db/queries";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(listChildren());
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { name: string; color?: string; icon?: string };
  if (!body.name || !body.name.trim()) {
    return NextResponse.json({ error: "MISSING_NAME" }, { status: 400 });
  }
  const r = createChild({ name: body.name.trim(), color: body.color, icon: body.icon });
  return NextResponse.json(r);
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { id: number; name?: string; color?: string; icon?: string; sortOrder?: number };
  if (!Number.isFinite(body.id)) return NextResponse.json({ error: "BAD_ID" }, { status: 400 });
  const patch: any = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.color !== undefined) patch.color = body.color;
  if (body.icon !== undefined) patch.icon = body.icon;
  if (body.sortOrder !== undefined) patch.sortOrder = body.sortOrder;
  const r = updateChild(body.id, patch);
  return NextResponse.json(r);
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const id = Number(url.searchParams.get("id"));
  if (!Number.isFinite(id)) return NextResponse.json({ error: "BAD_ID" }, { status: 400 });
  deleteChild(id);
  return NextResponse.json({ ok: true });
}
