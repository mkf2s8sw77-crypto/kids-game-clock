"use client";
import { GameSession, Child } from "@/lib/types";
import { formatDateTimeCN, formatDurationSec } from "@/lib/time";
import { getIcon } from "@/lib/icons";
import { CirclePlay, CircleStop, Pencil } from "lucide-react";

export function RecentSessions({
  sessions,
  childMap,
}: {
  sessions: GameSession[];
  childMap: Record<number, Child>;
}) {
  if (sessions.length === 0) {
    return <div className="text-sm text-slate-500 text-center py-6">本周还没有记录</div>;
  }
  return (
    <ul className="divide-y divide-slate-100">
      {sessions.map((s) => {
        const c = childMap[s.childId];
        const Icon = c ? getIcon(c.icon) : CirclePlay;
        return (
          <li key={s.id} className="py-3 flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white flex-shrink-0"
              style={{ backgroundColor: c?.color ?? "#94a3b8" }}
            >
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                {c?.name ?? "未知孩子"}
                {s.source === "manual" && (
                  <span title="手动补录" className="text-amber-600">
                    <Pencil className="w-3 h-3" />
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {formatDateTimeCN(s.startedAt)}
                {s.endedAt ? "" : " · 进行中"}
              </div>
            </div>
            <div className="text-sm tabular-nums text-slate-700 flex items-center gap-1">
              {s.endedAt ? (
                formatDurationSec(s.durationSeconds)
              ) : (
                <>
                  <CirclePlay className="w-3.5 h-3.5 text-emerald-500" />
                  <CircleStop className="w-3.5 h-3.5 text-rose-500 hidden" />
                  进行中
                </>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
