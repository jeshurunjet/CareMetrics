import AdminAccess from "@/modules/admin/ui/AdminAccess"
import { requirePreview } from "@/lib/require-preview"
import Dashboard from "@/modules/admin/ui/Dashboard"
export default function Page() {
  requirePreview()
  return (
    <AdminAccess>
      <Dashboard />
    </AdminAccess>
  )
}
