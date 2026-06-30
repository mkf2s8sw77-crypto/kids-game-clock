import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "app.db");
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// 建表（与 lib/db/schema.ts 同步）
db.exec(`
  CREATE TABLE IF NOT EXISTS children (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#3b82f6',
    icon TEXT NOT NULL DEFAULT 'cat',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS game_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    child_id INTEGER NOT NULL,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    source TEXT NOT NULL DEFAULT 'device',
    note TEXT,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS weekly_bonuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    week_start_date TEXT NOT NULL,
    minutes INTEGER NOT NULL,
    reason TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// 清空（覆盖式 seed）
db.exec(`DELETE FROM children; DELETE FROM game_sessions; DELETE FROM weekly_bonuses; DELETE FROM settings;`);

// 重新设置自增 ID
db.exec(`DELETE FROM sqlite_sequence WHERE name IN ('children','game_sessions','weekly_bonuses');`);

const now = new Date();
const iso = now.toISOString();

// 三个孩子
const children = [
  { name: "小明", color: "#3b82f6", icon: "cat", sortOrder: 0 },
  { name: "小红", color: "#ec4899", icon: "heart", sortOrder: 1 },
  { name: "小亮", color: "#f97316", icon: "star", sortOrder: 2 },
];
const insertChild = db.prepare(`INSERT INTO children (name, color, icon, sort_order, created_at) VALUES (?, ?, ?, ?, ?)`);
for (const c of children) {
  insertChild.run(c.name, c.color, c.icon, c.sortOrder, iso);
}
const allChildren = db.prepare(`SELECT id, name FROM children ORDER BY sort_order`).all() as { id: number; name: string }[];
console.log("✓ 已创建孩子:", allChildren.map((c) => c.name).join(", "));

// 周开始日期工具：返回指定日期所在周（周一）的 YYYY-MM-DD
function getWeekStart(d: Date): string {
  const ms = d.getTime() - d.getTimezoneOffset() * 60_000;
  const local = new Date(ms);
  const y = local.getFullYear();
  const m = String(local.getMonth() + 1).padStart(2, "0");
  const da = String(local.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function tzLocal(date: Date): string {
  // 返回 YYYY-MM-DDTHH:mm:ss 在 Asia/Shanghai 的本地时间
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });
  const parts = dtf.formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value;
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`;
}

// 把一个本地 "YYYY-MM-DD HH:mm" 字符串（视为 Asia/Shanghai）转成 UTC ISO
function localToUtc(s: string): string {
  // s 形如 "2025-06-30 19:30"
  const [date, time] = s.split(" ");
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  // 用 Intl 找到 TZ 偏移
  const ref = new Date(Date.UTC(y, mo - 1, d, h, mi));
  // 在 Asia/Shanghai 下 ref 的本地表示
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Shanghai",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
  const parts = dtf.formatToParts(ref);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asLocal = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") === 24 ? 0 : get("hour"), get("minute"));
  const offsetMin = (asLocal - ref.getTime()) / 60_000;
  return new Date(ref.getTime() - offsetMin * 60_000).toISOString();
}

// 计算"本周一"（Shanghai）00:00 的 UTC ISO
function thisMondayUtc(): string {
  const now = new Date();
  // 当前 Shanghai 日期
  const sh = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const y = Number(sh.find((p) => p.type === "year")?.value);
  const m = Number(sh.find((p) => p.type === "month")?.value);
  const d = Number(sh.find((p) => p.type === "day")?.value);
  const local = new Date(Date.UTC(y, m - 1, d));
  const dow = local.getUTCDay(); // 0..6
  const shift = (dow + 6) % 7;
  local.setUTCDate(local.getUTCDate() - shift);
  return localToUtc(`${local.getUTCFullYear()}-${String(local.getUTCMonth() + 1).padStart(2, "0")}-${String(local.getUTCDate()).padStart(2, "0")} 00:00`);
}

const weekStart = thisMondayUtc();
const weekStartDate = weekStart.slice(0, 10);
console.log("✓ 本周开始:", weekStartDate);

const insertSession = db.prepare(`
  INSERT INTO game_sessions (child_id, started_at, ended_at, duration_seconds, source, note, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
const insertBonus = db.prepare(`
  INSERT INTO weekly_bonuses (week_start_date, minutes, reason, created_at) VALUES (?, ?, ?, ?)
`);

// helper: 在指定周（相对本周：-1, 0, 1...）某天本地时间生成一条 session
function addSession(weekOffset: number, dayOfWeek: number, startHM: string, endHM: string, childIdx: number, source: "device" | "manual" = "device", note: string | null = null) {
  // weekOffset: -1 = 上周, 0 = 本周
  // dayOfWeek: 0=周一, 1=周二 ... 6=周日
  // 起点是本周一
  const monUtc = new Date(weekStart);
  const dayUtc = new Date(monUtc.getTime() + (weekOffset * 7 + dayOfWeek) * 86400_000);
  const dateStr = dayUtc.toISOString().slice(0, 10);
  const startedAt = localToUtc(`${dateStr} ${startHM}`);
  const endedAt = localToUtc(`${dateStr} ${endHM}`);
  const sec = Math.floor((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000);
  const child = allChildren[childIdx % allChildren.length];
  insertSession.run(child.id, startedAt, endedAt, sec, source, note, iso);
  return { child: child.name, duration: sec };
}

// --- 上周记录（4-5 条）---
addSession(-1, 1, "10:00", "10:35", 0);  // 周二 小明 35min
addSession(-1, 2, "15:00", "15:45", 1);  // 周三 小红 45min
addSession(-1, 4, "20:00", "20:30", 2);  // 周五 小亮 30min
addSession(-1, 5, "09:30", "10:30", 0);  // 周六 小明 60min
addSession(-1, 6, "14:00", "14:20", 1);  // 周日 小红 20min
console.log("✓ 上周记录 5 条");

// --- 上上周记录（2-3 条）---
addSession(-2, 2, "10:00", "10:25", 0);
addSession(-2, 3, "16:00", "16:40", 1);
addSession(-2, 6, "19:00", "19:50", 2);
console.log("✓ 上上周记录 3 条");

// --- 上周奖励 +30min ---
const lastWeekMonday = (() => {
  const d = new Date(weekStart);
  d.setUTCDate(d.getUTCDate() - 7);
  return d.toISOString().slice(0, 10);
})();
insertBonus.run(lastWeekMonday, 30, "考试进步，主动奖励", iso);
console.log("✓ 上周奖励 +30min（考试进步）");

// --- 本周记录（90 分钟）---
addSession(0, 0, "19:00", "19:30", 0);  // 本周一 小明 30min
addSession(0, 2, "20:00", "20:35", 1);  // 本周三 小红 35min
addSession(0, 4, "16:00", "16:25", 2);  // 本周五 小亮 25min
console.log("✓ 本周记录 3 条（共 90 分钟）");

console.log("\n========= Seed 完成 =========");
console.log("• 孩子:", allChildren.length, "个");
const allSess = db.prepare("SELECT COUNT(*) as n FROM game_sessions").get() as any;
console.log("• 游戏记录:", allSess.n, "条");
const allBon = db.prepare("SELECT COUNT(*) as n FROM weekly_bonuses").get() as any;
console.log("• 奖励记录:", allBon.n, "条");
console.log("• 本周已用：90 / 210 分钟");
console.log("• 状态：空闲，无活动 session");
console.log("=============================");
