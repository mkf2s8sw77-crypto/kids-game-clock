import { NextRequest, NextResponse } from "next/server";
import { deleteSession, getSession, updateSession } from "@/lib/db/queries";
import { requireAdminApi } from "@/lib/api-guard";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const unauth = await requireAdminApi();
  if (unauth) return unauth;
  const { id } = await ctx.params;
  const sid = Number(id);
  if (!Number.isFinite(sid)) return NextResponse.json({ error: "BAD_ID" }, { status: 400 });
  const body = (await req.json().catch(() => ({}))) as any;
  try {
    const r = updateSession(sid, {
      startedAt: body.startedAt,
      endedAt: body.endedAt,
      note: body.note,
    });
    return NextResponse.json(r);
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const unauth = await requireAdminApi();
  if (unauth) return unauth;
  const { id } = await ctx.params;
  const sid = Number(id);
  if (!Number.isFinite(sid)) return NextResponse.json({ error: "BAD_ID" }, { status: 400 });
  deleteSession(sid);
  return NextResponse.json({ ok: true });
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sid = Number(id);
  if (!Number.isFinite(sid)) return NextResponse.json({ error: "BAD_ID" }, { status: 400 });
  const r = getSession(sid);
  if (!r) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json(r);
}
