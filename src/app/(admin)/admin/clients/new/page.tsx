import AdminAccess from "@/modules/admin/ui/AdminAccess"
import { requirePreview } from "@/lib/require-preview"
import ClientForm from "@/modules/admin/clients/ClientForm"
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  requirePreview()
  const q = await searchParams
  return (
    <AdminAccess>
      <ClientForm houseId={typeof q.tab === "string" ? q.tab : undefined} />
    </AdminAccess>
  )
}
