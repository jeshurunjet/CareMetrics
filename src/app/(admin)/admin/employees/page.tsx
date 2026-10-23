import AdminAccess from "@/modules/admin/ui/AdminAccess"
import { requirePreview } from "@/lib/require-preview"
import EmployeeDirectory from "@/modules/admin/employees/EmployeeDirectory"
export default function Page() {
  requirePreview()
  return (
    <AdminAccess>
      <EmployeeDirectory />
    </AdminAccess>
  )
}
