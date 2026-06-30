import { requireAdmin } from "@/lib/admin-guard";
import { listChildren } from "@/lib/db/queries";
import { ChildrenPage } from "@/components/admin/ChildrenPage";

export const dynamic = "force-dynamic";

export default async function ChildrenRoute() {
  await requireAdmin();
  const children = listChildren();
  return <ChildrenPage initialChildren={children} />;
}
