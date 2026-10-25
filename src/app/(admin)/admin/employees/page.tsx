import { isBackendEnabled } from "@/server/config/backend"
import { staffPage } from "@/server/data/page"
import { managementDirectory } from "@/server/admin/read"
import ManagementDirectory from "@/modules/admin/manage/ManagementDirectory"
import AdminAccess from "@/modules/admin/ui/AdminAccess"
import { requirePreview } from "@/lib/require-preview"
import EmployeeDirectory from "@/modules/admin/employees/EmployeeDirectory"
export default function Page() {
  if (isBackendEnabled())
    return staffPage(managementDirectory, (data) => (
      <ManagementDirectory data={data} kind="employees" />
    ))
  requirePreview()
  return (
    <AdminAccess>
      <EmployeeDirectory />
    </AdminAccess>
  )
}
