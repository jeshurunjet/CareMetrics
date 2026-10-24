import { isBackendEnabled } from "@/server/config/backend"
import { staffPage } from "@/server/data/page"
import { getCurrentStaff } from "@/server/data/staff"
import { FutureRead } from "@/modules/staff/read/StaffReadViews"
import { requirePreview } from "@/lib/require-preview"
import Settings from "@/modules/staff/profile/Settings"
export default function Page() {
  if (isBackendEnabled())
    return staffPage(getCurrentStaff, () => <FutureRead title="Settings" />)
  requirePreview()
  return <Settings />
}
