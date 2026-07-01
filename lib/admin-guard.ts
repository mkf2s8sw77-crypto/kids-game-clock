import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionCookieValue, SESSION_COOKIE_NAME } from "./auth";

export async function requireAdmin() {
  const c = await cookies();
  const v = c.get(SESSION_COOKIE_NAME)?.value;
  if (!verifySessionCookieValue(v)) {
    redirect("/admin/login");
  }
}
