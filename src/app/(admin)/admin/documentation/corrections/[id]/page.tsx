import { notFound } from "next/navigation"
import { requirePreview } from "@/lib/require-preview"
import AdminAccess from "@/modules/admin/ui/AdminAccess"
import CorrectionReview from "@/modules/admin/records/CorrectionReview"
import { validKey } from "@/modules/admin/documentation/validation"
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  requirePreview()
  const { id } = await params,
    q = await searchParams
  if (!validKey(id) || Object.keys(q).length > 0) notFound()
  return (
    <AdminAccess>
      <CorrectionReview id={id} />
    </AdminAccess>
  )
}
