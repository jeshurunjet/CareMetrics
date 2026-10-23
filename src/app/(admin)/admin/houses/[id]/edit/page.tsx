import AdminAccess from "@/modules/admin/ui/AdminAccess"
import { validateAdminId } from "@/modules/admin/data/route-loader"
import HouseForm from "@/modules/admin/houses/HouseForm"
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  validateAdminId("houses", id)
  return (
    <AdminAccess>
      <HouseForm key={id} id={id} />
    </AdminAccess>
  )
}
