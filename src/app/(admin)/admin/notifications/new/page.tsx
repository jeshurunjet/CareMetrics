import AdminAccess from "@/modules/admin/ui/AdminAccess"
import NoticeEditor from "@/modules/admin/notices/NoticeEditor"
import { validateQuery } from "@/modules/admin/governance/route-validation"
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  validateQuery(await searchParams, "detail")

  return (
    <AdminAccess>
      <NoticeEditor />
    </AdminAccess>
  )
}
