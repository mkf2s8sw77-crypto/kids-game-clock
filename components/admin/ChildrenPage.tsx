"use client";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Child } from "@/lib/types";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/client";
import { getIcon } from "@/lib/icons";
import { Plus, Pencil, Trash2, X } from "lucide-react";

const COLOR_PRESETS = [
  "#3b82f6", "#ec4899", "#f97316", "#22c55e", "#a855f7", "#06b6d4", "#eab308", "#ef4444",
];
const ICON_PRESETS = ["cat", "heart", "star", "gamepad", "smile", "sun", "cloud", "zap"];

export function ChildrenPage({ initialChildren }: { initialChildren: Child[] }) {
  const [children, setChildren] = useState(initialChildren);
  const [editing, setEditing] = useState<Child | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setChildren(await apiGet<Child[]>("/api/children"));
  }

  async function handleDelete(c: Child) {
    if (!confirm(`确定删除「${c.name}」？关联的游戏记录也会被删除。`)) return;
    setBusy(true);
    try {
      await apiDelete(`/api/children?id=${c.id}`);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">孩子</h1>
          <p className="text-sm text-slate-500 mt-0.5">管理家庭成员，共享 3.5 小时游戏时长池</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" /> 新增孩子
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {children.map((c) => {
          const Icon = getIcon(c.icon);
          return (
            <Card key={c.id} className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white flex-shrink-0"
                style={{ backgroundColor: c.color }}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-800">{c.name}</div>
                <div className="text-xs text-slate-500">图标: {c.icon} · 颜色: {c.color}</div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setEditing(c)}
                  className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-brand-600"
                  aria-label="编辑"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(c)}
                  disabled={busy}
                  className="p-1.5 rounded hover:bg-rose-50 text-slate-500 hover:text-rose-600"
                  aria-label="删除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          );
        })}
        {children.length === 0 && (
          <Card className="col-span-3 text-center py-12 text-slate-500">还没有孩子，先添加一个吧</Card>
        )}
      </div>

      {showAdd && (
        <ChildFormDialog
          onClose={() => setShowAdd(false)}
          onSaved={async () => { setShowAdd(false); await refresh(); }}
        />
      )}
      {editing && (
        <ChildFormDialog
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => { setEditing(null); await refresh(); }}
        />
      )}
    </div>
  );
}

function ChildFormDialog({ initial, onClose, onSaved }: {
  initial?: Child;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState(initial?.color ?? COLOR_PRESETS[0]);
  const [icon, setIcon] = useState(initial?.icon ?? ICON_PRESETS[0]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    if (!name.trim()) return setErr("请输入名字");
    setBusy(true);
    setErr(null);
    try {
      if (initial) {
        await apiPatch("/api/children", { id: initial.id, name: name.trim(), color, icon });
      } else {
        await apiPost("/api/children", { name: name.trim(), color, icon });
      }
      onSaved();
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  const Icon = getIcon(icon);

  return (
    <Modal title={initial ? `编辑 ${initial.name}` : "新增孩子"} onClose={onClose}>
      <div className="space-y-3">
        <div>
          <Label>名字</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：小明" autoFocus />
        </div>
        <div>
          <Label>颜色</Label>
          <div className="flex gap-2 flex-wrap">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-9 h-9 rounded-full ring-2 ${color === c ? "ring-slate-800" : "ring-transparent"}`}
                style={{ backgroundColor: c }}
                aria-label={c}
              />
            ))}
          </div>
        </div>
        <div>
          <Label>图标</Label>
          <div className="flex gap-2 flex-wrap">
            {ICON_PRESETS.map((name) => {
              const I = getIcon(name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setIcon(name)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ring-2 ${icon === name ? "ring-brand-500 bg-brand-50" : "ring-slate-200 bg-white"} text-slate-700`}
                  aria-label={name}
                >
                  <I className="w-5 h-5" />
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: color }}
          >
            <Icon className="w-6 h-6" />
          </div>
          <div className="text-sm text-slate-600">预览：<span className="font-medium text-slate-800">{name || "（未命名）"}</span></div>
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
