import BackendEntry from "@/modules/auth/ui/BackendEntry"
import { isBackendEnabled } from "@/server/config/backend"
import { requirePreview } from "@/lib/require-preview"
import Dashboard from "@/modules/staff/ui/Dashboard"
export default function Page() {
  if (isBackendEnabled()) return <BackendEntry page="dashboard" />
  requirePreview()
  return <Dashboard />
}
