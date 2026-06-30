import crypto from "node:crypto";
import { SESSION_COOKIE, SESSION_TTL_DAYS } from "./config";

const SECRET = process.env.SESSION_SECRET || "dev-fallback-secret";
const TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

function sign(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
}

export function makeSessionCookieValue(): { value: string; maxAgeSec: number } {
  const exp = Date.now() + TTL_MS;
  const payload = `kgc.${exp}`;
  const sig = sign(payload);
  return { value: `${payload}.${sig}`, maxAgeSec: Math.floor(TTL_MS / 1000) };
}

export function verifySessionCookieValue(value: string | undefined | null): boolean {
  if (!value) return false;
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  const [tag, expStr, sig] = parts;
  if (tag !== "kgc") return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = sign(`kgc.${expStr}`);
  // constant-time compare
  if (sig.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
