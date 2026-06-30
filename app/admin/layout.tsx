import { AdminShell } from "@/components/admin/AdminShell";
import { LOGO_URL } from "@/lib/config";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // 注意：cookie 校验在每个受保护的页面中单独进行
  // 这样 /admin/login 不需要鉴权也能访问
  return <AdminShell logoUrl={LOGO_URL}>{children}</AdminShell>;
}
