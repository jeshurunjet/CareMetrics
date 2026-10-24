import BackendEntry from "@/modules/auth/ui/BackendEntry"
import { isBackendEnabled } from "@/server/config/backend"
import AdminAccess from "@/modules/admin/ui/AdminAccess"
import { requirePreview } from "@/lib/require-preview"
import Dashboard from "@/modules/admin/ui/Dashboard"
export default function Page() {
  if (isBackendEnabled()) return <BackendEntry page="admin" />
  requirePreview()
  return (
    <AdminAccess>
      <Dashboard />
    </AdminAccess>
  )
}
