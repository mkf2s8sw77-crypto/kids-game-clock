"use client";
import { formatMinutes } from "@/lib/time";

export function PerChildBar({
  items,
  totalMinutes,
}: {
  items: { childId: number; childName: string; color: string; minutes: number }[];
  totalMinutes: number;
}) {
  if (items.length === 0 || totalMinutes === 0) {
    return null;
  }
  return (
    <div className="space-y-2.5">
      {items.map((it) => {
        const pct = totalMinutes > 0 ? (it.minutes / totalMinutes) * 100 : 0;
        return (
          <div key={it.childId}>
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>{it.childName}</span>
              <span className="tabular-nums">{formatMinutes(it.minutes)}</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: it.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
