"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { GameSession, WeekStats, WeeklyBonus } from "@/lib/types";
import { apiGet } from "@/lib/client";
import { formatDateTimeCN, formatMinutes, formatDateCN } from "@/lib/time";
import { Clock, Activity, TrendingUp, Gift, CirclePlay, RefreshCw } from "lucide-react";

export function AdminOverview({
  stats: initialStats,
  recent: initialRecent,
  bonuses: initialBonuses,
}: {
  stats: WeekStats;
  recent: GameSession[];
  bonuses: WeeklyBonus[];
}) {
  const [stats, setStats] = useState(initialStats);
  const [recent, setRecent] = useState(initialRecent);
  const [bonuses, setBonuses] = useState(initialBonuses);
  const [busy, setBusy] = useState(false);

  const pct = stats.quotaMinutes > 0 ? Math.round((stats.usedMinutes / stats.quotaMinutes) * 100) : 0;

  async function refresh() {
    setBusy(true);
    try {
      const [s, rec, bn] = await Promise.all([
        apiGet<WeekStats>("/api/stats?week=current"),
        apiGet<GameSession[]>("/api/sessions?limit=8"),
        apiGet<WeeklyBonus[]>("/api/bonuses"),
      ]);
      setStats(s);
      setRecent(rec);
      setBonuses(bn.filter((b) => b.weekStartDate === s.weekStartDate));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">概览</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            本周 {formatDateCN(stats.weekStartUTC)} 起 · 重置于下周一 00:00
          </p>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <RefreshCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} />
          刷新
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="本周配额"
          value={formatMinutes(stats.quotaMinutes)}
          sub={stats.bonusMinutes > 0 ? `基础 3.5h + 奖励 ${stats.bonusMinutes}m` : "基础 3.5 小时"}
          color="bg-blue-50 text-blue-700"
          icon={Clock}
        />
        <StatCard
          label="已用"
          value={formatMinutes(stats.usedMinutes)}
          sub={`占配额 ${pct}%`}
          color="bg-amber-50 text-amber-700"
          icon={TrendingUp}
        />
        <StatCard
          label="剩余"
          value={formatMinutes(stats.remainingMinutes)}
          sub="含奖励分钟数"
          color={stats.remainingMinutes === 0 ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}
          icon={Activity}
        />
        <StatCard
          label="活动状态"
          value={stats.activeSession ? "进行中" : "空闲"}
          sub={stats.activeSession ? `开始于 ${formatDateTimeCN(stats.activeSession.startedAt)}` : "未计时"}
          color={stats.activeSession ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600"}
          icon={CirclePlay}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="col-span-2">
          <div className="text-sm font-medium text-slate-700 mb-3">本周每日（分钟）</div>
          <DayBarChart perDay={stats.perDay} />
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <div className="text-sm font-medium text-slate-700 mb-3">最近记录</div>
          {recent.length === 0 ? (
            <div className="text-sm text-slate-500 py-6 text-center">暂无记录</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((s) => (
                <li key={s.id} className="py-2.5 flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white flex-shrink-0">
                    <CirclePlay className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-slate-800 font-medium">{s.endedAt ? "已完成" : "进行中"}</div>
                    <div className="text-xs text-slate-500">{formatDateTimeCN(s.startedAt)}</div>
                  </div>
                  <div className="text-slate-700 tabular-nums">
                    {s.endedAt ? formatMinutes(Math.floor(s.durationSeconds / 60)) : "进行中"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-slate-700">本周奖励</div>
            <Gift className="w-4 h-4 text-amber-500" />
          </div>
          {bonuses.length === 0 ? (
            <div className="text-sm text-slate-500 py-6 text-center">本周还没有奖励</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {bonuses.map((b) => (
                <li key={b.id} className="py-2.5 text-sm flex items-start gap-2">
                  <span className="font-bold text-emerald-600 tabular-nums w-16">+{b.minutes}m</span>
                  <span className="text-slate-700 flex-1">{b.reason || "（无说明）"}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color, icon: Icon }: {
  label: string; value: string; sub: string; color: string; icon: any;
}) {
  return (
    <div className="bg-white rounded-2xl ring-1 ring-slate-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="text-sm text-slate-500">{label}</div>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-800 tabular-nums">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{sub}</div>
    </div>
  );
}

function DayBarChart({ perDay }: { perDay: { date: string; minutes: number }[] }) {
  const max = Math.max(...perDay.map((d) => d.minutes), 30);
  const labels = ["一", "二", "三", "四", "五", "六", "日"];
  return (
    <div className="flex items-end gap-2 h-40">
      {perDay.map((d, i) => {
        const h = max > 0 ? (d.minutes / max) * 100 : 0;
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="text-xs text-slate-500 tabular-nums">{d.minutes}</div>
            <div className="w-full flex-1 flex items-end">
              <div
                className="w-full bg-gradient-to-t from-brand-500 to-brand-400 rounded-t transition-all"
                style={{ height: `${Math.max(2, h)}%` }}
              />
            </div>
            <div className="text-xs text-slate-600">周{labels[i]}</div>
          </div>
        );
      })}
    </div>
  );
}
