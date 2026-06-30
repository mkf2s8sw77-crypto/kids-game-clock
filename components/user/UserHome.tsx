"use client";
import { useEffect, useState, useMemo } from "react";
import { apiGet, apiPost } from "@/lib/client";
import { useNow } from "@/lib/useNow";
import { Child, GameSession, WeekStats } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { RemainingRing } from "./RemainingRing";
import { ChildPicker } from "./ChildPicker";
import { TimerButton } from "./TimerButton";
import { RecentSessions } from "./RecentSessions";
import { PerChildBar } from "./PerChildBar";
import { RefreshCw, Settings } from "lucide-react";
import { BASE_PATH, LOGO_URL } from "@/lib/config";
import { formatDateCN } from "@/lib/time";

function secondsBetween(a: string, b: string): number {
  return Math.max(0, Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 1000));
}

export function UserHome({ initialStats, initialChildren, initialRecent }: {
  initialStats: WeekStats;
  initialChildren: Child[];
  initialRecent: GameSession[];
}) {
  const [stats, setStats] = useState<WeekStats>(initialStats);
  const [children, setChildren] = useState<Child[]>(initialChildren);
  const [recent, setRecent] = useState<GameSession[]>(initialRecent);
  const [selectedChild, setSelectedChild] = useState<number | null>(initialChildren[0]?.id ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const now = useNow(1000);

  const childMap = useMemo(() => {
    const m: Record<number, Child> = {};
    for (const c of children) m[c.id] = c;
    return m;
  }, [children]);

  const active = stats.activeSession;
  const activeChild = active ? childMap[active.childId] : null;
  const isOursActive = active && active.childId === selectedChild;
  const isOtherActive = active && active.childId !== selectedChild;

  const activeElapsedSec = active ? secondsBetween(active.startedAt, now) : 0;
  // 实时预计本周末累计（含进行中）
  const liveUsed = stats.usedMinutes + (active ? Math.floor(activeElapsedSec / 60) : 0);
  const liveRemaining = Math.max(0, stats.quotaMinutes - liveUsed);

  async function refresh() {
    try {
      const [s, list, rec] = await Promise.all([
        apiGet<WeekStats>("/api/stats?week=current"),
        apiGet<Child[]>("/api/children"),
        apiGet<GameSession[]>("/api/sessions?week=current&source=device"),
      ]);
      setStats(s);
      setChildren(list);
      setRecent(rec.slice(0, 5));
    } catch (e: any) {
      setError(String(e?.message ?? e));
    }
  }

  async function handleClick() {
    if (!selectedChild) {
      setError("请先选择孩子");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (active) {
        // 如果当前进行的是别人的，提示一下
        if (isOtherActive) {
          setError(`${activeChild?.name ?? "其他孩子"} 正在游戏中，请先结束`);
          return;
        }
        await apiPost("/api/sessions/end");
      } else {
        await apiPost("/api/sessions/start", { childId: selectedChild });
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
      {/* header */}
      <header className="px-4 pt-6 pb-3 flex items-center gap-3 max-w-md mx-auto">
        <img src={LOGO_URL} alt="logo" className="w-10 h-10 rounded-full bg-white ring-1 ring-slate-200" />
        <div className="flex-1">
          <h1 className="text-lg font-bold text-slate-800">游戏计时</h1>
          <p className="text-xs text-slate-500">本周 {formatDateCN(stats.weekStartUTC)} 起</p>
        </div>
        <a
          href="/admin"
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
          aria-label="管理端"
        >
          <Settings className="w-5 h-5" />
        </a>
      </header>

      <div className="max-w-md mx-auto px-4 pb-12 space-y-4">
        {/* remaining */}
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

        {/* child picker */}
        <Card>
          <div className="text-sm text-slate-500 mb-2">选择孩子</div>
          <ChildPicker children={children} value={selectedChild} onChange={setSelectedChild} />
        </Card>

        {/* timer button */}
        <div className="pt-1">
          <TimerButton
            active={!!isOursActive}
            loading={loading}
            disabled={!!isOtherActive}
            onClick={handleClick}
          />
          {active && (
            <div className="mt-3 text-center">
              {isOursActive ? (
                <div className="text-sm text-rose-600 font-medium">
                  {activeChild?.name} 正在游戏中 · 已进行 {Math.floor(activeElapsedSec / 60)} 分钟
                </div>
              ) : (
                <div className="text-sm text-amber-600">
                  {activeChild?.name} 正在游戏中，请先结束
                </div>
              )}
            </div>
          )}
          {error && <div className="mt-3 text-center text-sm text-rose-600">{error}</div>}
        </div>

        {/* per child bar */}
        {stats.perChild.some((c) => c.minutes > 0) && (
          <Card>
            <div className="text-sm text-slate-700 font-medium mb-3">本周累计（按孩子）</div>
            <PerChildBar items={stats.perChild} totalMinutes={stats.usedMinutes} />
          </Card>
        )}

        {/* recent */}
        <Card>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-slate-700 font-medium">最近记录</div>
            <button onClick={refresh} className="p-1.5 rounded hover:bg-slate-100 text-slate-500" aria-label="刷新">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <RecentSessions sessions={recent} childMap={childMap} />
        </Card>

        <div className="text-center text-xs text-slate-400 pt-4">
          周一 00:00 自动重置 · 共享 3.5 小时池
        </div>
      </div>
    </main>
  );
}
