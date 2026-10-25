import { isBackendEnabled } from "@/server/config/backend"
import { staffPage } from "@/server/data/page"
import { clientEditor } from "@/server/admin/read"
import { ClientEditor } from "@/modules/admin/manage/ManagementForms"
import AdminAccess from "@/modules/admin/ui/AdminAccess"
import { validateAdminId } from "@/modules/admin/data/route-loader"
import ClientForm from "@/modules/admin/clients/ClientForm"
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (isBackendEnabled())
    return staffPage(
      () => clientEditor(id),
      (data) => <ClientEditor data={data} />,
    )
  validateAdminId("clients", id)
  return (
    <AdminAccess>
      <ClientForm key={id} id={id} />
    </AdminAccess>
  )
}
