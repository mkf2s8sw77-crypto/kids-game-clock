"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { apiPost } from "@/lib/client";
import { BASE_PATH } from "@/lib/config";
import { Lock } from "lucide-react";

export function LoginForm() {
  const [pw, setPw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiPost("/api/auth", { password: pw });
      router.push("/admin");
      router.refresh();
    } catch (e: any) {
      setError("口令错误");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="pw">管理员口令</Label>
        <div className="relative">
          <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            id="pw"
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="请输入口令"
            className="pl-9"
            autoFocus
          />
        </div>
      </div>
      {error && <div className="text-sm text-rose-600">{error}</div>}
      <Button type="submit" loading={loading} className="w-full" size="lg">
        登录
      </Button>
    </form>
  );
}
