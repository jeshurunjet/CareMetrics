import AdminAccess from "@/modules/admin/ui/AdminAccess"
import NoticesPage from "@/modules/admin/notices/NoticesPage"
import { validateQuery } from "@/modules/admin/governance/route-validation"
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const q = validateQuery(await searchParams, "notices")
  return (
    <AdminAccess>
      <NoticesPage tab={q.tab} />
    </AdminAccess>
  )
}
