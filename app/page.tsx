import { getWeekStats, listSessions } from "@/lib/db/queries";
import { UserHome } from "@/components/user/UserHome";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const stats = getWeekStats(undefined, 56);  // 用户端用 8 周 (56 天)
  // 最近记录：取已结束的最近 5 条，不限制周/来源
  const recent = listSessions({ limit: 20 }).filter((s) => s.endedAt).slice(0, 5);
  return <UserHome initialStats={stats} initialRecent={recent} />;
}
