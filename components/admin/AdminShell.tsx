"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, ListChecks, Gift, LogOut, Gamepad2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { apiPost } from "@/lib/client";
import { BASE_PATH } from "@/lib/config";

const NAV = [
  { href: "/admin", label: "概览", icon: LayoutDashboard, exact: true },
  { href: "/admin/records", label: "记录", icon: ListChecks },
  { href: "/admin/bonus", label: "奖惩", icon: Gift },
];

export function AdminShell({ children, logoUrl }: { children: React.ReactNode; logoUrl: string }) {
  const pathname = usePathname();
  const router = useRouter();

  // 登录页不要显示侧栏与顶栏
  if (pathname?.startsWith(`${BASE_PATH}/admin/login`)) {
    return <>{children}</>;
  }

  async function handleLogout() {
    try {
      await apiPost("/api/auth", { action: "logout" });
    } catch {}
    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-60 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 left-0 z-10">
        <div className="px-5 py-5 border-b border-slate-200 flex items-center gap-3">
          <img src={logoUrl} alt="logo" className="w-9 h-9 rounded-full" />
          <div>
            <div className="font-bold text-slate-800">游戏计时</div>
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <Gamepad2 className="w-3 h-3" /> 管理端
            </div>
          </div>
        </div>
        <nav className="p-3 space-y-1 flex-1">
          {NAV.map((n) => {
            const active = n.exact ? pathname === `${BASE_PATH}${n.href}` : pathname?.startsWith(`${BASE_PATH}${n.href}`);
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition",
                  active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100",
                )}
              >
                <Icon className="w-4 h-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-200">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-100"
          >
            ← 回到用户端
          </Link>
        </div>
      </aside>
      <div className="flex-1 ml-60 flex flex-col min-h-screen">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-end px-6">
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-rose-600"
          >
            <LogOut className="w-4 h-4" />
            退出
          </button>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
