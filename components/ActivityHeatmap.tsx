"use client";
import { useMemo } from "react";

export interface DailyEntry {
  date: string; // YYYY-MM-DD (Asia/Shanghai)
  minutes: number;
}

interface Props {
  daily: DailyEntry[];
  weeks?: number; // 默认 12
  className?: string;
}

function colorClass(min: number): string {
  if (min <= 0) return "bg-slate-100";
  if (min < 15) return "bg-emerald-100";
  if (min < 45) return "bg-emerald-300";
  if (min < 90) return "bg-emerald-500";
  return "bg-emerald-700";
}

function buildGrid(daily: DailyEntry[], weeks: number): DailyEntry[][] {
  if (daily.length === 0) return [];
  // 升序，取最后 weeks*7 天
  const data = daily.slice(-weeks * 7);
  // 如果不足 weeks*7，前面补零值（直到列首为周一）
  const firstDate = data[0].date;
  // dayOfWeek: 0=Sun, 1=Mon, ..., 6=Sat
  const firstMs = Date.UTC(
    Number(firstDate.slice(0, 4)),
    Number(firstDate.slice(5, 7)) - 1,
    Number(firstDate.slice(8, 10)),
  );
  // 用 UTC 算 dow 跟 TZ 一致（因为 date 字符串已经是 TZ 的 wall clock）
  const dow = new Date(firstMs).getUTCDay();
  const offsetToMonday = (dow + 6) % 7; // Mon=0
  const pad: DailyEntry[] = [];
  for (let i = offsetToMonday; i > 0; i--) {
    const ms = firstMs - i * 86400_000;
    const ymd = new Date(ms).toISOString().slice(0, 10);
    pad.push({ date: ymd, minutes: 0 });
  }
  const full = [...pad, ...data];
  // 按 7 天分列
  const cols: DailyEntry[][] = [];
  for (let i = 0; i + 7 <= full.length; i += 7) {
    cols.push(full.slice(i, i + 7));
  }
  return cols;
}

function monthLabel(ymd: string): string {
  const m = Number(ymd.slice(5, 7));
  return `${m}月`;
}

export function ActivityHeatmap({ daily, weeks = 12, className = "" }: Props) {
  const grid = useMemo(() => buildGrid(daily, weeks), [daily, weeks]);
  // 月份标签：取每周第一列的周一日期的月份
  const monthLabels: { col: number; label: string }[] = [];
  let lastMonth = "";
  grid.forEach((col, i) => {
    const m = monthLabel(col[0].date);
    if (m !== lastMonth) {
      monthLabels.push({ col: i, label: m });
      lastMonth = m;
    }
  });

  if (grid.length === 0) {
    return (
      <div className={`text-sm text-slate-500 py-6 text-center ${className}`}>
        暂无数据
      </div>
    );
  }

  const totalMinutes = daily.reduce((s, d) => s + d.minutes, 0);
  const activeDays = daily.filter((d) => d.minutes > 0).length;

  return (
    <div className={className}>
      <div className="flex gap-3">
        {/* Y 轴：周一到周日 */}
        <div className="flex flex-col justify-between text-[10px] text-slate-500 pt-0.5 pb-3 select-none" style={{ height: "112px" }}>
          <span>一</span>
          <span>三</span>
          <span>五</span>
          <span>日</span>
        </div>

        {/* 网格 */}
        <div className="flex-1 overflow-x-auto pb-3">
          <div className="flex gap-[3px]">
            {grid.map((col, ci) => (
              <div key={ci} className="flex flex-col gap-[3px]">
                {col.map((cell, ri) => (
                  <div
                    key={ri}
                    title={`${cell.date} · ${cell.minutes} 分钟`}
                    className={`w-[14px] h-[14px] rounded-sm ${colorClass(cell.minutes)}`}
                  />
                ))}
              </div>
            ))}
          </div>
          {/* 月份标签 */}
          <div className="relative h-3 mt-1 text-[10px] text-slate-500">
            {monthLabels.map((m) => (
              <span
                key={m.col}
                className="absolute"
                style={{ left: `${m.col * 17}px` }}
              >
                {m.label}
              </span>
            ))}
          </div>
        </div>
      </div>
      {/* 图例 + 统计 */}
      <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
        <span>过去 {grid.length} 周 · 共 {activeDays} 天有记录 · {totalMinutes} 分钟</span>
        <div className="flex items-center gap-1">
          <span>少</span>
          <div className="w-[12px] h-[12px] rounded-sm bg-slate-100" />
          <div className="w-[12px] h-[12px] rounded-sm bg-emerald-100" />
          <div className="w-[12px] h-[12px] rounded-sm bg-emerald-300" />
          <div className="w-[12px] h-[12px] rounded-sm bg-emerald-500" />
          <div className="w-[12px] h-[12px] rounded-sm bg-emerald-700" />
          <span>多</span>
        </div>
      </div>
    </div>
  );
}
