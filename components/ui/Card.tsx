import { cn } from "@/lib/cn";
import { HTMLAttributes } from "react";

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-4", className)}
      {...rest}
    />
  );
}
