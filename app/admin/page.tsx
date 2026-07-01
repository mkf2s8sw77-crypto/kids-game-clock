import { requireAdmin } from "@/lib/admin-guard";
import { getWeekStats, listSessions, listBonuses } from "@/lib/db/queries";
import { AdminOverview } from "@/components/admin/AdminOverview";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const stats = getWeekStats(undefined, 84);  // admin 用 12 周 (84 天)
  const recent = listSessions({ limit: 8 });
  const bonuses = listBonuses(stats.weekStartDate);
  return (
    <AdminOverview
      stats={stats}
      recent={recent}
      bonuses={bonuses}
    />
  );
}
