"use client";
import { formatMinutes } from "@/lib/time";

export function RemainingRing({
  quotaMinutes,
  usedMinutes,
  remainingMinutes,
}: {
  quotaMinutes: number;
  usedMinutes: number;
  remainingMinutes: number;
}) {
  const pct = quotaMinutes > 0 ? Math.min(100, Math.round((usedMinutes / quotaMinutes) * 100)) : 0;
  const r = 64;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  const rest = c - dash;
  const color = pct >= 100 ? "#dc2626" : pct >= 80 ? "#f59e0b" : "#2563eb";

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-44 h-44">
        <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
          <circle cx="80" cy="80" r={r} stroke="#e2e8f0" strokeWidth="14" fill="none" />
          <circle
            cx="80"
            cy="80"
            r={r}
            stroke={color}
            strokeWidth="14"
            fill="none"
            strokeDasharray={`${dash} ${rest}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-bold tabular-nums" style={{ color }}>
            {remainingMinutes}
          </div>
          <div className="text-xs text-slate-500 mt-1">剩余分钟</div>
        </div>
      </div>
      <div className="mt-3 text-sm text-slate-600">
        本周已用 <b className="text-slate-900 tabular-nums">{formatMinutes(usedMinutes)}</b>
        {" / "}
        总额 <b className="text-slate-900 tabular-nums">{formatMinutes(quotaMinutes)}</b>
      </div>
    </div>
  );
}
