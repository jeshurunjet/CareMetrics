import { isBackendEnabled } from "@/server/config/backend"
import { deferredPage } from "@/server/data/deferred-page"
import AdminAccess from "@/modules/admin/ui/AdminAccess"
import NoticeEditor from "@/modules/admin/notices/NoticeEditor"
import { validateQuery } from "@/modules/admin/governance/route-validation"
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  if (isBackendEnabled()) return deferredPage(true)

  validateQuery(await searchParams, "detail")

  return (
    <AdminAccess>
      <NoticeEditor />
    </AdminAccess>
  )
}
