import { isBackendEnabled } from "@/server/config/backend"
import { staffPage } from "@/server/data/page"
import { employeeEditor } from "@/server/admin/read"
import { EmployeeEditor } from "@/modules/admin/manage/ManagementForms"
import AdminAccess from "@/modules/admin/ui/AdminAccess"
import { validateAdminId } from "@/modules/admin/data/route-loader"
import EmployeeForm from "@/modules/admin/employees/EmployeeForm"
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (isBackendEnabled())
    return staffPage(
      () => employeeEditor(id),
      (data) => <EmployeeEditor data={data} />,
    )
  validateAdminId("employees", id)
  return (
    <AdminAccess>
      <EmployeeForm key={id} id={id} />
    </AdminAccess>
  )
}
