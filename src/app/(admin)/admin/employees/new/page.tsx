import { isBackendEnabled } from "@/server/config/backend"
import { staffPage } from "@/server/data/page"
import { employeeEditor } from "@/server/admin/read"
import { EmployeeEditor } from "@/modules/admin/manage/ManagementForms"
import AdminAccess from "@/modules/admin/ui/AdminAccess"
import { requirePreview } from "@/lib/require-preview"
import EmployeeForm from "@/modules/admin/employees/EmployeeForm"
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  if (isBackendEnabled())
    return staffPage(
      () => employeeEditor(),
      (data) => <EmployeeEditor data={data} />,
    )
  requirePreview()
  await searchParams
  return (
    <AdminAccess>
      <EmployeeForm />
    </AdminAccess>
  )
}
