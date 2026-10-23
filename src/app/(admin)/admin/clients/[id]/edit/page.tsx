import AdminAccess from "@/modules/admin/ui/AdminAccess"
import { validateAdminId } from "@/modules/admin/data/route-loader"
import ClientForm from "@/modules/admin/clients/ClientForm"
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  validateAdminId("clients", id)
  return (
    <AdminAccess>
      <ClientForm key={id} id={id} />
    </AdminAccess>
  )
}
