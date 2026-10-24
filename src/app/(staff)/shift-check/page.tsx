import BackendEntry from "@/modules/auth/ui/BackendEntry"
import { isBackendEnabled } from "@/server/config/backend"
import { requirePreview } from "@/lib/require-preview"
import ClockIn from "@/modules/staff/ui/ClockIn"
export default function Page() {
  if (isBackendEnabled()) return <BackendEntry page="shifts" />
  requirePreview()
  return <ClockIn />
}
