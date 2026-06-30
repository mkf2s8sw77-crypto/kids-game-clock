"use client";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { WeeklyBonus } from "@/lib/types";
import { apiDelete, apiGet, apiPost } from "@/lib/client";
import { formatDateCN, formatDateTimeCN } from "@/lib/time";
import { Gift, Plus, Trash2 } from "lucide-react";

export function BonusPage({ bonuses: initial, currentWeek }: { bonuses: WeeklyBonus[]; currentWeek: string }) {
  const [bonuses, setBonuses] = useState(initial);
  const [weekStart, setWeekStart] = useState(currentWeek);
  const [minutes, setMinutes] = useState(30);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function refresh() {
    setBonuses(await apiGet<WeeklyBonus[]>("/api/bonuses"));
  }

  async function submit() {
    if (!Number.isFinite(minutes) || minutes === 0) {
      setErr("分钟数必须非零");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await apiPost("/api/bonuses", { weekStartDate: weekStart, minutes, reason: reason.trim() });
      setReason("");
      await refresh();
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(b: WeeklyBonus) {
    if (!confirm(`确定删除 +${b.minutes} 分钟奖励？`)) return;
    setBusy(true);
    try {
      await apiDelete(`/api/bonuses?id=${b.id}`);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">奖励</h1>
        <p className="text-sm text-slate-500 mt-0.5">为特定周手动增加时长（正数为奖励，负数为扣减）</p>
      </div>

      <Card>
        <div className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
          <Gift className="w-4 h-4 text-amber-500" /> 新增奖励
        </div>
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-3">
            <Label>周开始日期</Label>
            <Input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} />
            <div className="text-xs text-slate-500 mt-1">本周 {formatDateCN(weekStart + "T00:00:00+08:00")}</div>
          </div>
          <div className="col-span-2">
            <Label>分钟数</Label>
            <Input type="number" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} step={5} />
          </div>
          <div className="col-span-5">
            <Label>原因</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="例如：考试进步" />
          </div>
          <div className="col-span-2 flex items-end">
            <Button onClick={submit} loading={busy} className="w-full">
              <Plus className="w-4 h-4" /> 添加
            </Button>
          </div>
        </div>
        {err && <div className="text-sm text-rose-600 mt-2">{err}</div>}
      </Card>

      <Card>
        <div className="text-sm font-medium text-slate-700 mb-3">历史奖励</div>
        {bonuses.length === 0 ? (
          <div className="text-sm text-slate-500 py-8 text-center">还没有奖励记录</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {bonuses.map((b) => (
              <li key={b.id} className="py-3 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${b.minutes >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                  <span className="text-sm font-bold tabular-nums">{b.minutes >= 0 ? "+" : ""}{b.minutes}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-800 font-medium">
                    {b.reason || "（无说明）"}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    周 {formatDateCN(b.weekStartDate + "T00:00:00+08:00")} 起 · 添加于 {formatDateTimeCN(b.createdAt)}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(b)}
                  disabled={busy}
                  className="p-1.5 rounded hover:bg-rose-50 text-slate-500 hover:text-rose-600"
                  aria-label="删除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
