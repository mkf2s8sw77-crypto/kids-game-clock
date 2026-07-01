"use client";
import { GameSession } from "@/lib/types";
import { formatDateTimeCN, formatDurationSec } from "@/lib/time";
import { CirclePlay, CircleStop, Pencil } from "lucide-react";

export function RecentSessions({ sessions }: { sessions: GameSession[] }) {
  if (sessions.length === 0) {
    return <div className="text-sm text-slate-500 text-center py-6">本周还没有记录</div>;
  }
  return (
    <ul className="divide-y divide-slate-100">
      {sessions.map((s) => (
        <li key={s.id} className="py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center text-white flex-shrink-0">
            {s.endedAt ? <CircleStop className="w-4 h-4" /> : <CirclePlay className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
              {s.endedAt ? "已完成" : "进行中"}
              {s.source === "manual" && (
                <span title="手动补录" className="text-amber-600">
                  <Pencil className="w-3 h-3" />
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {formatDateTimeCN(s.startedAt)}
            </div>
          </div>
          <div className="text-sm tabular-nums text-slate-700">
            {s.endedAt ? formatDurationSec(s.durationSeconds) : "—"}
          </div>
        </li>
      ))}
    </ul>
  );
}
