import AdminAccess from "@/modules/admin/ui/AdminAccess"
import RosterPage from "@/modules/admin/workforce/RosterPage"
import { validateWorkforceQuery } from "@/modules/admin/workforce/route-validation"
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  validateWorkforceQuery(await searchParams, false)
  return (
    <AdminAccess>
      <RosterPage />
    </AdminAccess>
  )
}
