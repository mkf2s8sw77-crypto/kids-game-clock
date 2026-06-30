import { requireAdmin } from "@/lib/admin-guard";
import { getWeekStats, listSessions, listChildren, listBonuses } from "@/lib/db/queries";
import { AdminOverview } from "@/components/admin/AdminOverview";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const stats = getWeekStats();
  const recent = listSessions({ limit: 8 });
  const children = listChildren();
  const bonuses = listBonuses(stats.weekStartDate);
  return (
    <AdminOverview
      stats={stats}
      recent={recent}
      children={children}
      bonuses={bonuses}
    />
  );
}
