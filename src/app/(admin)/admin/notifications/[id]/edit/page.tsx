import { isBackendEnabled } from "@/server/config/backend"
import { deferredPage } from "@/server/data/deferred-page"
import AdminAccess from "@/modules/admin/ui/AdminAccess"
import NoticeEditor from "@/modules/admin/notices/NoticeEditor"
import {
  validateQuery,
  validateId,
} from "@/modules/admin/governance/route-validation"
export default async function Page({
  searchParams,
  params,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
  params: Promise<{ id: string }>
}) {
  if (isBackendEnabled()) return deferredPage(true)

  validateQuery(await searchParams, "detail")
  const { id } = await params
  validateId(id)
  return (
    <AdminAccess>
      <NoticeEditor id={id} />
    </AdminAccess>
  )
}
