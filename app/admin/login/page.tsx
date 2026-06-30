import { LoginForm } from "@/components/admin/LoginForm";
import { LOGO_URL } from "@/lib/config";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg ring-1 ring-slate-200 p-8">
        <div className="flex flex-col items-center mb-6">
          <img src={LOGO_URL} alt="logo" className="w-16 h-16 rounded-full ring-2 ring-slate-200 mb-3" />
          <h1 className="text-xl font-bold text-slate-800">游戏计时 · 管理端</h1>
          <p className="text-sm text-slate-500 mt-1">输入口令登录</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
