import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { makeSessionCookieValue, verifySessionCookieValue, SESSION_COOKIE_NAME } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { password?: string; action?: string };
  const action = body.action ?? "login";
  if (action === "logout") {
    const c = await cookies();
    c.delete(SESSION_COOKIE_NAME);
    return NextResponse.json({ ok: true });
  }
  const expected = process.env.ADMIN_PASSWORD || "kids-admin";
  if (!body.password || body.password !== expected) {
    return NextResponse.json({ ok: false, error: "INVALID_PASSWORD" }, { status: 401 });
  }
  const { value, maxAgeSec } = makeSessionCookieValue();
  const c = await cookies();
  c.set(SESSION_COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/kids-game-clock",
    maxAge: maxAgeSec,
  });
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const c = await cookies();
  const v = c.get(SESSION_COOKIE_NAME)?.value;
  return NextResponse.json({ ok: verifySessionCookieValue(v) });
}
