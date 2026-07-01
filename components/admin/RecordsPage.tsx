"use client";
import { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { GameSession, WeekStats } from "@/lib/types";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/client";
import { formatDateTimeCN, formatDateCN, formatDurationSec, formatMinutes, getWeekStartDate } from "@/lib/time";
import { Plus, Pencil, Trash2, X, Check, Filter } from "lucide-react";
import { cn } from "@/lib/cn";

export function RecordsPage({
  initialSessions,
  weekStart,
}: {
  initialSessions: GameSession[];
  weekStart: string;
}) {
  const [sessions, setSessions] = useState(initialSessions);
  const [filterSource, setFilterSource] = useState<string>("");
  const [filterWeek, setFilterWeek] = useState<string>("current");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<GameSession | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      if (filterSource && s.source !== filterSource) return false;
      if (filterWeek === "current") {
        return getWeekStartDate(s.startedAt) === weekStart;
      }
      if (filterWeek === "manual-only") {
        return s.source === "manual";
      }
      return true;
    });
  }, [sessions, filterSource, filterWeek, weekStart]);

  async function refresh() {
    const list = await apiGet<GameSession[]>("/api/sessions?limit=500");
    setSessions(list);
  }

  async function handleDelete(id: number) {
    if (!confirm("确定删除这条记录？")) return;
    setBusy(true);
    try {
      await apiDelete(`/api/sessions/${id}`);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">记录</h1>
          <p className="text-sm text-slate-500 mt-0.5">查看、补录、编辑、删除打卡记录</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" /> 手动补录
        </Button>
      </div>

      <Card className="flex items-end gap-4">
        <div className="flex items-center gap-2 text-slate-500 pb-2">
          <Filter className="w-4 h-4" />
          <span className="text-sm">筛选</span>
        </div>
        <div className="w-40">
          <Label>来源</Label>
          <Select value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
            <option value="">全部</option>
            <option value="device">设备</option>
            <option value="manual">手动</option>
          </Select>
        </div>
        <div className="w-40">
          <Label>时间</Label>
          <Select value={filterWeek} onChange={(e) => setFilterWeek(e.target.value)}>
            <option value="all">全部</option>
            <option value="current">本周</option>
            <option value="manual-only">仅手动</option>
          </Select>
        </div>
        <div className="flex-1 text-right text-sm text-slate-500 pb-2">
          共 {filtered.length} 条
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">开始</th>
              <th className="text-left px-4 py-3">结束</th>
              <th className="text-right px-4 py-3">时长</th>
              <th className="text-left px-4 py-3">来源</th>
              <th className="text-left px-4 py-3">备注</th>
              <th className="text-right px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-500">无记录</td>
              </tr>
            )}
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 text-slate-700 tabular-nums">{formatDateTimeCN(s.startedAt)}</td>
                <td className="px-4 py-3 text-slate-700 tabular-nums">{s.endedAt ? formatDateTimeCN(s.endedAt) : "进行中"}</td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                  {s.endedAt ? formatDurationSec(s.durationSeconds) : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${s.source === "manual" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                    {s.source === "manual" ? "手动" : "设备"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate" title={s.note ?? ""}>
                  {s.note ?? ""}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => setEditing(s)}
                      className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-brand-600"
                      aria-label="编辑"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      disabled={busy}
                      className="p-1.5 rounded hover:bg-rose-50 text-slate-500 hover:text-rose-600"
                      aria-label="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {showAdd && (
        <AddSessionDialog
          onClose={() => setShowAdd(false)}
          onSaved={async () => {
            setShowAdd(false);
            await refresh();
          }}
        />
      )}
      {editing && (
        <EditSessionDialog
          session={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await refresh();
          }}
        />
      )}
    </div>
  );
}

function AddSessionDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  // 两种模式："duration"（默认，只填时长）/"exact"（精确开始/结束时间）
  const [mode, setMode] = useState<"duration" | "exact">("duration");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [duration, setDuration] = useState(30); // 时长模式：分钟数
  const [start, setStart] = useState("10:00");
  const [end, setEnd] = useState("10:30");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setErr(null);
    try {
      let startedAt: string;
      let endedAt: string;
      if (mode === "duration") {
        // 时长模式：end = 现在，start = now - duration 分钟
        const now = new Date();
        endedAt = now.toISOString();
        const startMs = now.getTime() - duration * 60_000;
        // 不能跨周：start 必须在当前周
        const startWeek = getWeekStartDate(new Date(startMs).toISOString());
        const currentWeek = getWeekStartDate();
        if (startWeek !== currentWeek) {
          setErr(`时长过长会跨周（本周从 ${currentWeek} 开始）。请缩短时长或切到精确时间模式`);
          setBusy(false);
          return;
        }
        startedAt = new Date(startMs).toISOString();
      } else {
        startedAt = new Date(`${date}T${start}:00+08:00`).toISOString();
        endedAt = new Date(`${date}T${end}:00+08:00`).toISOString();
      }
      await apiPost("/api/sessions", { startedAt, endedAt, note });
      onSaved();
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="手动补录" onClose={onClose}>
      <div className="space-y-3">
        {/* 模式切换 */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg w-fit">
          <button
            type="button"
            onClick={() => setMode("duration")}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition",
              mode === "duration" ? "bg-white shadow-sm text-brand-700 font-medium" : "text-slate-600 hover:text-slate-800"
            )}
          >
            只填时长
          </button>
          <button
            type="button"
            onClick={() => setMode("exact")}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition",
              mode === "exact" ? "bg-white shadow-sm text-brand-700 font-medium" : "text-slate-600 hover:text-slate-800"
            )}
          >
            精确时间
          </button>
        </div>

        {mode === "duration" ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>时长（分钟）</Label>
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  min={1}
                  step={5}
                  placeholder="30"
                />
                <div className="text-xs text-slate-500 mt-1">
                  默认：现在往前推 {duration} 分钟到当前
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label>日期</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>开始</Label>
              <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div>
              <Label>结束</Label>
              <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
        )}
        <div>
          <Label>备注</Label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="例如：忘了点结束 / 大约玩了半小时" />
        </div>
        {err && <div className="text-sm text-rose-600">{err}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>取消</Button>
          <Button onClick={submit} loading={busy}>保存</Button>
        </div>
      </div>
    </Modal>
  );
}

function EditSessionDialog({ session, onClose, onSaved }: { session: GameSession; onClose: () => void; onSaved: () => void }) {
  const initStart = new Date(session.startedAt);
  const initEnd = session.endedAt ? new Date(session.endedAt) : null;
  const toLocal = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const toTime = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const [date, setDate] = useState(toLocal(initStart));
  const [start, setStart] = useState(toTime(initStart));
  const [end, setEnd] = useState(initEnd ? toTime(initEnd) : "10:30");
  const [note, setNote] = useState(session.note ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setErr(null);
    try {
      const startedAt = new Date(`${date}T${start}:00+08:00`).toISOString();
      const endedAt = new Date(`${date}T${end}:00+08:00`).toISOString();
      await apiPatch(`/api/sessions/${session.id}`, { startedAt, endedAt, note });
      onSaved();
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  async function endNow() {
    setBusy(true);
    setErr(null);
    try {
      const now = new Date().toISOString();
      await apiPatch(`/api/sessions/${session.id}`, { endedAt: now });
      onSaved();
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={`编辑记录 #${session.id}`} onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label>日期</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label>开始</Label>
            <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <Label>结束</Label>
            <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        <div>
          <Label>备注</Label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        {err && <div className="text-sm text-rose-600">{err}</div>}
        <div className="flex justify-between gap-2 pt-2">
          <Button variant="ghost" onClick={endNow} loading={busy}>
            <Check className="w-4 h-4" /> 一键结束到现在
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>取消</Button>
            <Button onClick={submit} loading={busy}>保存</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl ring-1 ring-slate-200 w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
