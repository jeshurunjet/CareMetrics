import { isBackendEnabled } from "@/server/config/backend"
import { deferredPage } from "@/server/data/deferred-page"
import AdminAccess from "@/modules/admin/ui/AdminAccess"
import LeavePage from "@/modules/admin/workforce/LeavePage"
import { validateWorkforceQuery } from "@/modules/admin/workforce/route-validation"
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  if (isBackendEnabled()) return deferredPage(true)

  validateWorkforceQuery(await searchParams, true)
  return (
    <AdminAccess>
      <LeavePage />
    </AdminAccess>
  )
}
