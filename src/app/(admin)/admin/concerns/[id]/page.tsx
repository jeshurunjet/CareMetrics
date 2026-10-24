import AdminAccess from "@/modules/admin/ui/AdminAccess"
import ConcernReview from "@/modules/admin/notices/ConcernReview"
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
  validateQuery(await searchParams, "detail")
  const { id } = await params
  validateId(id)
  return (
    <AdminAccess>
      <ConcernReview id={id} />
    </AdminAccess>
  )
}
