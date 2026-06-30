import { requireAdmin } from "@/lib/admin-guard";
import { listChildren, listSessions, getWeekStats } from "@/lib/db/queries";
import { RecordsPage } from "@/components/admin/RecordsPage";

export const dynamic = "force-dynamic";

export default async function RecordsRoute() {
  await requireAdmin();
  const children = listChildren();
  const sessions = listSessions({ limit: 500 });
  const stats = getWeekStats();
  return <RecordsPage initialSessions={sessions} children={children} weekStart={stats.weekStartDate} />;
}
