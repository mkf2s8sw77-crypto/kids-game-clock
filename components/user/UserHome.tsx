"use client";
import { useState } from "react";
import { apiGet, apiPost } from "@/lib/client";
import { useNow } from "@/lib/useNow";
import { GameSession, WeekStats } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { TimerButton } from "./TimerButton";
import { RecentSessions } from "./RecentSessions";
import { RemainingRing } from "./RemainingRing";
import { RefreshCw, Settings } from "lucide-react";
import { LOGO_URL } from "@/lib/config";
import Link from "next/link";
import { formatDateCN } from "@/lib/time";

function secondsBetween(a: string, b: string): number {
  return Math.max(0, Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 1000));
}

export function UserHome({ initialStats, initialRecent }: {
  initialStats: WeekStats;
  initialRecent: GameSession[];
}) {
  const [stats, setStats] = useState<WeekStats>(initialStats);
  const [recent, setRecent] = useState<GameSession[]>(initialRecent);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const now = useNow(1000);

  const active = stats.activeSession;
  const activeElapsedSec = active ? secondsBetween(active.startedAt, now) : 0;
  const liveUsed = stats.usedMinutes + (active ? Math.floor(activeElapsedSec / 60) : 0);
  const liveRemaining = Math.max(0, stats.quotaMinutes - liveUsed);

  async function refresh() {
    try {
      const [s, rec] = await Promise.all([
        apiGet<WeekStats>("/api/stats?week=current"),
        apiGet<GameSession[]>("/api/sessions?week=current&source=device"),
      ]);
      setStats(s);
      setRecent(rec.slice(0, 5));
      setError(null);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    }
  }

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      if (active) {
        await apiPost("/api/sessions/end");
      } else {
        await apiPost("/api/sessions/start");
      }
      await refresh();
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="px-4 pt-6 pb-3 flex items-center gap-3 max-w-md mx-auto">
        <img src={LOGO_URL} alt="logo" className="w-10 h-10 rounded-full bg-white ring-1 ring-slate-200" />
        <div className="flex-1">
          <h1 className="text-lg font-bold text-slate-800">游戏计时</h1>
          <p className="text-xs text-slate-500">本周 {formatDateCN(stats.weekStartUTC)} 起</p>
        </div>
        <Link
          href="/admin"
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
          aria-label="管理端"
        >
          <Settings className="w-5 h-5" />
        </Link>
      </header>

      <div className="max-w-md mx-auto px-4 pb-12 space-y-4">
        <Card className="text-center">
          <RemainingRing
            quotaMinutes={stats.quotaMinutes}
            usedMinutes={liveUsed}
            remainingMinutes={liveRemaining}
          />
          {stats.bonusMinutes > 0 && (
            <div className="mt-2 text-xs text-amber-600">
              含本周奖励 +{stats.bonusMinutes} 分钟
            </div>
          )}
        </Card>

        <div className="pt-1">
          <TimerButton active={!!active} loading={loading} onClick={handleClick} />
          {active && (
            <div className="mt-3 text-center text-sm text-rose-600 font-medium">
              游戏中 · 已进行 {Math.floor(activeElapsedSec / 60)} 分钟
            </div>
          )}
          {error && <div className="mt-3 text-center text-sm text-rose-600">{error}</div>}
        </div>

        <Card>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-slate-700 font-medium">最近记录</div>
            <button onClick={refresh} className="p-1.5 rounded hover:bg-slate-100 text-slate-500" aria-label="刷新">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <RecentSessions sessions={recent} />
        </Card>

        <div className="text-center text-xs text-slate-400 pt-4">
          周一 00:00 自动重置 · 每周 3.5 小时
        </div>
      </div>
    </main>
  );
}
