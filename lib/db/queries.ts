import { db } from "./index";
import type { GameSession } from "@/lib/types";
import { gameSessions, weeklyBonuses, settings } from "./schema";
import { and, desc, eq, gte, isNotNull, isNull, lte, ne, sql } from "drizzle-orm";
import { QUOTA } from "../config";
import { getWeekStartUTC, getWeekStartDate, getWeekEndDate, nowIso } from "../time";

export function getActiveSession(): GameSession | null {
  const row = db.select().from(gameSessions).where(isNull(gameSessions.endedAt)).get();
  return (row as GameSession | undefined) ?? null;
}

export function listSessions(opts?: { weekStartDate?: string; source?: "device" | "manual"; limit?: number }): GameSession[] {
  const conditions = [];
  if (opts?.source) conditions.push(eq(gameSessions.source, opts.source));
  if (opts?.weekStartDate) {
    const start = getWeekStartUTC(opts.weekStartDate);
    const end = getWeekEndDate(opts.weekStartDate);
    conditions.push(gte(gameSessions.startedAt, start));
    conditions.push(lte(gameSessions.startedAt, end));
  }
  const where = conditions.length ? and(...conditions) : undefined;
  const rows = db
    .select()
    .from(gameSessions)
    .where(where as any)
    .orderBy(desc(gameSessions.startedAt))
    .limit(opts?.limit ?? 500)
    .all();
  return rows as unknown as GameSession[];
}

export function getSession(id: number) {
  return db.select().from(gameSessions).where(eq(gameSessions.id, id)).get();
}

export function startSession(source: "device" | "manual" = "device") {
  const active = getActiveSession();
  if (active) {
    throw new Error("ALREADY_ACTIVE");
  }
  return db
    .insert(gameSessions)
    .values({
      startedAt: nowIso(),
      source,
      createdAt: nowIso(),
    })
    .returning()
    .get();
}

export interface EndSessionResult {
  sessionId: number;
  durationSeconds: number;
  truncated: boolean;
}

export function endActiveSession(): EndSessionResult {
  const active = getActiveSession();
  if (!active) throw new Error("NO_ACTIVE");
  const now = nowIso();
  const startedMs = new Date(active.startedAt).getTime();
  const nowMs = new Date(now).getTime();
  let durationSec = Math.max(0, Math.floor((nowMs - startedMs) / 1000));
  const weekStartDate = getWeekStartDate(now);
  const usedBefore = sumWeekUsedSeconds(weekStartDate, active.id);
  const quotaSec = (QUOTA.weeklyBaseMinutes + sumWeekBonusMinutes(weekStartDate)) * 60;
  const allowedSec = Math.max(0, quotaSec - usedBefore);
  let truncated = false;
  if (durationSec > allowedSec) {
    durationSec = allowedSec;
    truncated = true;
  }
  const note = truncated
    ? (active.note ? active.note + " | auto-truncated" : "auto-truncated")
    : active.note ?? null;
  db.update(gameSessions)
    .set({ endedAt: now, durationSeconds: durationSec, note })
    .where(eq(gameSessions.id, active.id))
    .run();
  return { sessionId: active.id, durationSeconds: durationSec, truncated };
}

export function manualAddSession(input: { startedAt: string; endedAt: string; note?: string }) {
  const startMs = new Date(input.startedAt).getTime();
  const endMs = new Date(input.endedAt).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    throw new Error("BAD_TIME_RANGE");
  }
  const weekStartDate = getWeekStartDate(input.startedAt);
  const startWeek = getWeekStartDate(input.startedAt);
  const endWeek = getWeekStartDate(input.endedAt);
  if (startWeek !== endWeek) {
    throw new Error("CROSS_WEEK_NOT_ALLOWED");
  }
  const usedBefore = sumWeekUsedSeconds(weekStartDate, undefined, input.startedAt);
  const quotaSec = (QUOTA.weeklyBaseMinutes + sumWeekBonusMinutes(weekStartDate)) * 60;
  const allowedSec = Math.max(0, quotaSec - usedBefore);
  let durationSec = Math.floor((endMs - startMs) / 1000);
  let truncated = false;
  if (durationSec > allowedSec) {
    durationSec = allowedSec;
    truncated = true;
  }
  const note = (input.note ?? "") + (truncated ? " | auto-truncated" : "");
  return db
    .insert(gameSessions)
    .values({
      startedAt: input.startedAt,
      endedAt: input.endedAt,
      durationSeconds: durationSec,
      source: "manual",
      note: note || null,
      createdAt: nowIso(),
    })
    .returning()
    .get();
}

export function updateSession(
  id: number,
  patch: { startedAt?: string; endedAt?: string; note?: string | null },
) {
  const current = getSession(id);
  if (!current) throw new Error("NOT_FOUND");
  const merged = { ...current, ...patch };
  if (patch.endedAt !== undefined || patch.startedAt !== undefined) {
    if (merged.endedAt) {
      const ms = new Date(merged.endedAt).getTime() - new Date(merged.startedAt).getTime();
      merged.durationSeconds = Math.max(0, Math.floor(ms / 1000));
    }
  }
  return db
    .update(gameSessions)
    .set({
      startedAt: merged.startedAt,
      endedAt: merged.endedAt,
      durationSeconds: merged.durationSeconds,
      note: patch.note !== undefined ? patch.note : merged.note,
    })
    .where(eq(gameSessions.id, id))
    .returning()
    .get();
}

export function deleteSession(id: number) {
  return db.delete(gameSessions).where(eq(gameSessions.id, id)).run();
}

// ---------- Bonuses ----------
export function listBonuses(weekStartDate?: string) {
  if (weekStartDate) {
    return db.select().from(weeklyBonuses).where(eq(weeklyBonuses.weekStartDate, weekStartDate)).orderBy(desc(weeklyBonuses.createdAt)).all();
  }
  return db.select().from(weeklyBonuses).orderBy(desc(weeklyBonuses.createdAt)).all();
}

export function createBonus(input: { weekStartDate: string; minutes: number; reason: string }) {
  if (!Number.isFinite(input.minutes) || input.minutes === 0) throw new Error("BAD_MINUTES");
  return db
    .insert(weeklyBonuses)
    .values({
      weekStartDate: input.weekStartDate,
      minutes: Math.trunc(input.minutes),
      reason: input.reason ?? "",
      createdAt: nowIso(),
    })
    .returning()
    .get();
}

export function deleteBonus(id: number) {
  return db.delete(weeklyBonuses).where(eq(weeklyBonuses.id, id)).run();
}

// ---------- Aggregates ----------
export function sumWeekUsedSeconds(weekStartDate: string, excludeSessionId?: number, onOrAfter?: string): number {
  const start = getWeekStartUTC(weekStartDate);
  const end = getWeekEndDate(weekStartDate);
  const conds: any[] = [
    isNotNull(gameSessions.endedAt),
    gte(gameSessions.startedAt, start),
    lte(gameSessions.startedAt, end),
  ];
  if (excludeSessionId != null) {
    conds.push(ne(gameSessions.id, excludeSessionId));
  }
  if (onOrAfter) {
    conds.push(gte(gameSessions.endedAt, onOrAfter));
  }
  const row = db
    .select({ s: sql<number>`COALESCE(SUM(${gameSessions.durationSeconds}), 0)` })
    .from(gameSessions)
    .where(and(...conds))
    .get();
  return row?.s ?? 0;
}

export function sumWeekBonusMinutes(weekStartDate: string): number {
  const row = db
    .select({ s: sql<number>`COALESCE(SUM(${weeklyBonuses.minutes}), 0)` })
    .from(weeklyBonuses)
    .where(eq(weeklyBonuses.weekStartDate, weekStartDate))
    .get();
  return row?.s ?? 0;
}

export interface WeekStats {
  weekStartDate: string;
  weekEndDate: string;
  weekStartUTC: string;
  weekEndUTC: string;
  quotaMinutes: number;
  bonusMinutes: number;
  usedMinutes: number;
  remainingMinutes: number;
  activeSession: ReturnType<typeof getActiveSession>;
  perDay: { date: string; minutes: number }[];
  daily: { date: string; minutes: number }[];
}

export function getWeekStats(weekStartDate?: string, days: number = 84): WeekStats {
  const date = weekStartDate ?? getWeekStartDate();
  const start = getWeekStartUTC(date);
  const end = getWeekEndDate(date);
  const usedSec = sumWeekUsedSeconds(date);
  const bonusMin = sumWeekBonusMinutes(date);
  const quotaMin = QUOTA.weeklyBaseMinutes + bonusMin;
  const usedMin = Math.floor(usedSec / 60);
  const remainingMin = Math.max(0, quotaMin - usedMin);

  const perDay: { date: string; minutes: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const dayStart = new Date(new Date(start).getTime() + i * 86400_000).toISOString();
    const dayEnd = new Date(new Date(start).getTime() + (i + 1) * 86400_000 - 1).toISOString();
    const row = db
      .select({ s: sql<number>`COALESCE(SUM(${gameSessions.durationSeconds}), 0)` })
      .from(gameSessions)
      .where(
        and(
          isNotNull(gameSessions.endedAt),
          gte(gameSessions.startedAt, dayStart),
          lte(gameSessions.startedAt, dayEnd),
        ),
      )
      .get();
    const ymd = (() => {
      const dtf = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" });
      return dtf.format(new Date(dayStart));
    })();
    perDay.push({ date: ymd, minutes: Math.floor((row?.s ?? 0) / 60) });
  }

  // 活动热力图数据：过去 N 天每天的累计时长（按 Asia/Shanghai 聚合）
  // 从今天往前推 N-1 天，再补到最早一天所在周的周一（保证 7×N 完整网格）
  const daily: { date: string; minutes: number }[] = [];
  const todayMs = Date.now();
  // 收集原始数据：先按 session 全量聚合到 date
  const allRows = db
    .select({
      startedAt: gameSessions.startedAt,
      duration: gameSessions.durationSeconds,
    })
    .from(gameSessions)
    .where(isNotNull(gameSessions.endedAt))
    .all();
  const byDate = new Map<string, number>();
  for (const r of allRows) {
    const ymd = (() => {
      const dtf = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" });
      return dtf.format(new Date(r.startedAt));
    })();
    byDate.set(ymd, (byDate.get(ymd) ?? 0) + r.duration);
  }
  // 从 N-1 天前到今天，逐日填入
  for (let i = days - 1; i >= 0; i--) {
    const dayMs = todayMs - i * 86400_000;
    const dtf = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" });
    const ymd = dtf.format(new Date(dayMs));
    daily.push({ date: ymd, minutes: Math.floor((byDate.get(ymd) ?? 0) / 60) });
  }

  return {
    weekStartDate: date,
    weekEndDate: getWeekStartDate(new Date(new Date(end).getTime() + 86400_000).toISOString()),
    weekStartUTC: start,
    weekEndUTC: end,
    quotaMinutes: quotaMin,
    bonusMinutes: bonusMin,
    usedMinutes: usedMin,
    remainingMinutes: remainingMin,
    activeSession: getActiveSession(),
    perDay,
    daily,
  };
}

// ---------- Settings ----------
export function getSetting(key: string): string | undefined {
  return db.select().from(settings).where(eq(settings.key, key)).get()?.value;
}

export function setSetting(key: string, value: string) {
  return db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } })
    .run();
}

// ---------- Type assertions ----------
// drizzle 0.36 的 select/insert 返回值的 source 字段是 string 而非字面量
// 我们在数据访问层做一次 cast
