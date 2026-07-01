import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifySessionCookieValue, SESSION_COOKIE_NAME } from "./auth";

/**
 * 校验当前请求是否带有效管理员 cookie。
 * - 已鉴权：返回 null（路由继续执行）
 * - 未鉴权：返回 401 NextResponse，路由直接 return 即可
 */
export async function requireAdminApi(): Promise<NextResponse | null> {
  const c = await cookies();
  const v = c.get(SESSION_COOKIE_NAME)?.value;
  if (verifySessionCookieValue(v)) return null;
  return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
}
