import { isBackendEnabled } from "@/server/config/backend"
import { deferredPage } from "@/server/data/deferred-page"
import AdminAccess from "@/modules/admin/ui/AdminAccess"
import { requirePreview } from "@/lib/require-preview"
import FutureModule from "@/modules/admin/ui/FutureModule"
export default function Page() {
  if (isBackendEnabled()) return deferredPage(true)

  requirePreview()
  return (
    <AdminAccess>
      <FutureModule title="Settings" />
    </AdminAccess>
  )
}
