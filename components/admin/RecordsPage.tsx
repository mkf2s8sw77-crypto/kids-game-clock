"use client";
import { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { Child, GameSession, WeekStats } from "@/lib/types";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/client";
import { formatDateTimeCN, formatDateCN, formatDurationSec, formatMinutes, getWeekStartDate } from "@/lib/time";
import { getIcon } from "@/lib/icons";
import { Plus, Pencil, Trash2, X, Check, Filter } from "lucide-react";

export function RecordsPage({
  initialSessions,
  children: initialChildren,
  weekStart,
}: {
  initialSessions: GameSession[];
  children: Child[];
  weekStart: string;
}) {
  const [sessions, setSessions] = useState(initialSessions);
  const [children, setChildren] = useState(initialChildren);
  const [filterChild, setFilterChild] = useState<string>("");
  const [filterSource, setFilterSource] = useState<string>("");
  const [filterWeek, setFilterWeek] = useState<string>("current");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<GameSession | null>(null);
  const [busy, setBusy] = useState(false);

  const childMap: Record<number, Child> = {};
  for (const c of children) childMap[c.id] = c;

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      if (filterChild && s.childId !== Number(filterChild)) return false;
      if (filterSource && s.source !== filterSource) return false;
      if (filterWeek === "current") {
        return getWeekStartDate(s.startedAt) === weekStart;
      }
      if (filterWeek === "manual-only") {
        return s.source === "manual";
      }
      return true;
    });
  }, [sessions, filterChild, filterSource, filterWeek, weekStart]);

  async function refresh() {
    const [list, ch] = await Promise.all([
      apiGet<GameSession[]>("/api/sessions?limit=500"),
      apiGet<Child[]>("/api/children"),
    ]);
    setSessions(list);
    setChildren(ch);
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

      {/* 筛选 */}
      <Card className="flex items-end gap-4">
        <div className="flex items-center gap-2 text-slate-500 pb-2">
          <Filter className="w-4 h-4" />
          <span className="text-sm">筛选</span>
        </div>
        <div className="w-40">
          <Label>孩子</Label>
          <Select value={filterChild} onChange={(e) => setFilterChild(e.target.value)}>
            <option value="">全部</option>
            {children.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
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
              <th className="text-left px-4 py-3">孩子</th>
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
                <td colSpan={7} className="text-center py-12 text-slate-500">无记录</td>
              </tr>
            )}
            {filtered.map((s) => {
              const c = childMap[s.childId];
              const Icon = c ? getIcon(c.icon) : null;
              return (
                <tr key={s.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {c && (
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white"
                          style={{ backgroundColor: c.color }}
                        >
                          {Icon && <Icon className="w-3.5 h-3.5" />}
                        </div>
                      )}
                      <span className="font-medium text-slate-800">{c?.name ?? "未知"}</span>
                    </div>
                  </td>
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
              );
            })}
          </tbody>
        </table>
      </Card>

      {showAdd && (
        <AddSessionDialog
          children={children}
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
          children={children}
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

function AddSessionDialog({ children, onClose, onSaved }: { children: Child[]; onClose: () => void; onSaved: () => void }) {
  const [childId, setChildId] = useState<number | "">("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [start, setStart] = useState("10:00");
  const [end, setEnd] = useState("10:30");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    if (!childId) return setErr("请选择孩子");
    setBusy(true);
    setErr(null);
    try {
      const startedAt = new Date(`${date}T${start}:00+08:00`).toISOString();
      const endedAt = new Date(`${date}T${end}:00+08:00`).toISOString();
      await apiPost("/api/sessions", { childId, startedAt, endedAt, note });
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
        <div>
          <Label>孩子</Label>
          <Select value={childId} onChange={(e) => setChildId(Number(e.target.value))}>
            <option value="">请选择</option>
            {children.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
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
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="例如：忘了点结束" />
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

function EditSessionDialog({ session, children, onClose, onSaved }: { session: GameSession; children: Child[]; onClose: () => void; onSaved: () => void }) {
  const [childId, setChildId] = useState(session.childId);
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
      await apiPatch(`/api/sessions/${session.id}`, { childId, startedAt, endedAt, note });
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
      await apiPatch(`/api/sessions/${session.id}`, { childId, endedAt: now });
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
        <div>
          <Label>孩子</Label>
          <Select value={childId} onChange={(e) => setChildId(Number(e.target.value))}>
            {children.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
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
