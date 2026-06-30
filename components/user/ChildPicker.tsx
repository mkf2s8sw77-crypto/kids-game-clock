"use client";
import { Child } from "@/lib/types";
import { getIcon } from "@/lib/icons";
import { cn } from "@/lib/cn";

export function ChildPicker({
  children,
  value,
  onChange,
}: {
  children: Child[];
  value: number | null;
  onChange: (id: number) => void;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto -mx-1 px-1 pb-1">
      {children.map((c) => {
        const Icon = getIcon(c.icon);
        const selected = value === c.id;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(c.id)}
            className={cn(
              "flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl ring-1 transition min-w-[80px]",
              selected
                ? "ring-2 ring-brand-500 bg-brand-50"
                : "ring-slate-200 bg-white",
            )}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: c.color }}
            >
              <Icon className="w-6 h-6" />
            </div>
            <div className={cn("text-sm font-medium", selected ? "text-brand-700" : "text-slate-700")}>{c.name}</div>
          </button>
        );
      })}
    </div>
  );
}
