import { isBackendEnabled } from "@/server/config/backend"
import { staffPage } from "@/server/data/page"
import { houseEditor } from "@/server/admin/read"
import { HouseEditor } from "@/modules/admin/manage/ManagementForms"
import AdminAccess from "@/modules/admin/ui/AdminAccess"
import { validateAdminId } from "@/modules/admin/data/route-loader"
import HouseForm from "@/modules/admin/houses/HouseForm"
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (isBackendEnabled())
    return staffPage(
      () => houseEditor(id),
      (data) => <HouseEditor data={data} />,
    )
  validateAdminId("houses", id)
  return (
    <AdminAccess>
      <HouseForm key={id} id={id} />
    </AdminAccess>
  )
}
