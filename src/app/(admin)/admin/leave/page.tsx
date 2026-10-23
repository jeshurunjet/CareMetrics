import AdminAccess from "@/modules/admin/ui/AdminAccess"
import LeavePage from "@/modules/admin/workforce/LeavePage"
import { validateWorkforceQuery } from "@/modules/admin/workforce/route-validation"
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  validateWorkforceQuery(await searchParams, true)
  return (
    <AdminAccess>
      <LeavePage />
    </AdminAccess>
  )
}
