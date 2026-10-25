import { notFound } from "next/navigation"
import { isBackendEnabled } from "@/server/config/backend"
import { staffPage } from "@/server/data/page"
import { clientEditor } from "@/server/admin/read"
import { ClientEditor } from "@/modules/admin/manage/ManagementForms"
import AdminAccess from "@/modules/admin/ui/AdminAccess"
import { requirePreview } from "@/lib/require-preview"
import ClientForm from "@/modules/admin/clients/ClientForm"
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  if (isBackendEnabled()) {
    const query = await searchParams
    if (query.house !== undefined && typeof query.house !== "string") notFound()
    return staffPage(clientEditor, (data) => {
      if (
        typeof query.house === "string" &&
        !data.houses.some(
          (h) => h.id === query.house && h.status !== "Inactive",
        )
      )
        notFound()
      return (
        <ClientEditor
          data={data}
          houseId={typeof query.house === "string" ? query.house : undefined}
        />
      )
    })
  }
  requirePreview()
  const q = await searchParams
  return (
    <AdminAccess>
      <ClientForm houseId={typeof q.tab === "string" ? q.tab : undefined} />
    </AdminAccess>
  )
}
