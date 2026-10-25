import { isBackendEnabled } from "@/server/config/backend"
import { deferredPage } from "@/server/data/deferred-page"
import { notFound } from "next/navigation"
import { requirePreview } from "@/lib/require-preview"
import AdminAccess from "@/modules/admin/ui/AdminAccess"
import SubmittedRecordDetails from "@/modules/admin/records/SubmittedRecordDetails"
import { validKey } from "@/modules/admin/documentation/validation"
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  if (isBackendEnabled()) return deferredPage(true)

  requirePreview()
  const { id } = await params,
    q = await searchParams
  if (
    !validKey(id) ||
    Object.keys(q).some((k) => k !== "kind") ||
    !["diary", "care"].includes(q.kind as string)
  )
    notFound()
  return (
    <AdminAccess>
      <SubmittedRecordDetails id={id} kind={q.kind as "diary" | "care"} />
    </AdminAccess>
  )
}
