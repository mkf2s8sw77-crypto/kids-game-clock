import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionCookieValue, SESSION_COOKIE_NAME } from "./auth";
import { BASE_PATH } from "./config";

export async function requireAdmin() {
  const c = await cookies();
  const v = c.get(SESSION_COOKIE_NAME)?.value;
  if (!verifySessionCookieValue(v)) {
    redirect(`${BASE_PATH}/admin/login`);
  }
}
