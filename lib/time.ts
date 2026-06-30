import { TIMEZONE } from "./config";

/**
 * Format a UTC ISO string as YYYY-MM-DD in the configured timezone.
 */
export function formatDateInTZ(iso: string): string {
  if (!iso) return new Date().toISOString().slice(0, 10);
  const d = new Date(iso);
  if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const da = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${da}`;
}

/**
 * Return Monday 00:00 of the week containing `dateIso`, expressed as
 * the local-time date string in the configured timezone. This is
 * the canonical "week start" key (YYYY-MM-DD).
 *
 * Implementation: convert to TZ date string, parse Monday relative to that.
 */
export function getWeekStartDate(dateIso: string = new Date().toISOString()): string {
  if (!dateIso) dateIso = new Date().toISOString();
  // Get YYYY-MM-DD in TZ
  const dateStr = formatDateInTZ(dateIso);
  // Get day of week (0 = Sun, 1 = Mon ... 6 = Sat) for that local date
  const [y, m, d] = dateStr.split("-").map(Number);
  const local = new Date(Date.UTC(y, m - 1, d));
  const dow = local.getUTCDay(); // 0..6
  // We want Monday as start: shift so Mon=0, Sun=6
  const shift = (dow + 6) % 7;
  local.setUTCDate(local.getUTCDate() - shift);
  const yy = local.getUTCFullYear();
  const mm = String(local.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(local.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/**
 * Return Sunday 23:59:59.999 of the week containing dateIso, as a UTC ISO.
 * Used for query bounds.
 */
export function getWeekEndDate(dateIso: string = new Date().toISOString()): string {
  if (!dateIso) dateIso = new Date().toISOString();
  const weekStart = getWeekStartDate(dateIso);
  const [y, m, d] = weekStart.split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return new Date().toISOString();
  }
  // Sunday = +6 days
  const end = new Date(Date.UTC(y, m - 1, d + 6, 23, 59, 59, 999));
  return end.toISOString();
}

/**
 * Return the UTC ISO that corresponds to Monday 00:00:00 of `dateIso`'s week,
 * in the configured timezone.
 *
 * Implementation: parse "YYYY-MM-DDT00:00:00+08:00" → new Date() → toISOString().
 */
export function getWeekStartUTC(dateIso: string = new Date().toISOString()): string {
  if (!dateIso) dateIso = new Date().toISOString();
  const weekStart = getWeekStartDate(dateIso);
  // Treat as midnight Asia/Shanghai
  const d = new Date(`${weekStart}T00:00:00+08:00`);
  if (isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

/**
 * Format minutes into "Xh Ym" / "Xm" / "<1m" strings.
 */
export function formatMinutes(min: number): string {
  if (min < 1) return "不足1分钟";
  const h = Math.floor(min / 60);
  const m = Math.round(min - h * 60);
  if (h === 0) return `${m}分钟`;
  if (m === 0) return `${h}小时`;
  return `${h}小时${m}分钟`;
}

export function formatDurationSec(sec: number): string {
  const min = Math.floor(sec / 60);
  const s = sec % 60;
  if (min === 0) return `${s}秒`;
  if (s === 0) return `${min}分钟`;
  return `${min}分${s}秒`;
}

export function formatDateTimeCN(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: TIMEZONE,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export function formatDateCN(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function nowIso(): string {
  return new Date().toISOString();
}
