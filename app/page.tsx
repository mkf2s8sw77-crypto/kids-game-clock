import { getWeekStats, listChildren, listSessions } from "@/lib/db/queries";
import { UserHome } from "@/components/user/UserHome";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const stats = getWeekStats();
  const children = listChildren();
  const recent = listSessions({ weekStartDate: stats.weekStartDate, limit: 5, source: "device" });
  return <UserHome initialStats={stats} initialChildren={children} initialRecent={recent} />;
}
