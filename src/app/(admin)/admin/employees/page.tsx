import { isBackendEnabled } from "@/server/config/backend"
import { staffPage } from "@/server/data/page"
import { getManagementRecords } from "@/server/data/admin-read"
import { AdminRecordsRead } from "@/modules/admin/read/AdminReadViews"
import AdminAccess from "@/modules/admin/ui/AdminAccess"
import { requirePreview } from "@/lib/require-preview"
import EmployeeDirectory from "@/modules/admin/employees/EmployeeDirectory"
export default function Page() {
  if (isBackendEnabled())
    return staffPage(getManagementRecords, (data) => (
      <AdminRecordsRead data={data} kind="employees" />
    ))
  requirePreview()
  return (
    <AdminAccess>
      <EmployeeDirectory />
    </AdminAccess>
  )
}
