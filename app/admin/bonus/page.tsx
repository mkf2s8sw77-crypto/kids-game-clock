import { requireAdmin } from "@/lib/admin-guard";
import { getWeekStats, listBonuses } from "@/lib/db/queries";
import { BonusPage } from "@/components/admin/BonusPage";

export const dynamic = "force-dynamic";

export default async function BonusRoute() {
  await requireAdmin();
  const stats = getWeekStats();
  const bonuses = listBonuses();
  return <BonusPage bonuses={bonuses} currentWeek={stats.weekStartDate} />;
}
