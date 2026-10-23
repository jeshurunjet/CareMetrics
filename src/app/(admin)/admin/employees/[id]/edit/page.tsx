import AdminAccess from "@/modules/admin/ui/AdminAccess"
import { validateAdminId } from "@/modules/admin/data/route-loader"
import EmployeeForm from "@/modules/admin/employees/EmployeeForm"
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  validateAdminId("employees", id)
  return (
    <AdminAccess>
      <EmployeeForm key={id} id={id} />
    </AdminAccess>
  )
}
