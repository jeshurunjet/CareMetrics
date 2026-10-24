import AdminAccess from "@/modules/admin/ui/AdminAccess"
import ReportsPage from "@/modules/admin/reports/ReportsPage"
import { validateQuery } from "@/modules/admin/governance/route-validation"
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const q = validateQuery(await searchParams, "reports")
  return (
    <AdminAccess>
      <ReportsPage tab={q.tab} />
    </AdminAccess>
  )
}
