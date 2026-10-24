import { staffPage } from "@/server/data/page"
import { getStaffOverview } from "@/server/data/staff"
import { DashboardRead } from "@/modules/staff/read/StaffReadViews"
import { isBackendEnabled } from "@/server/config/backend"
import { requirePreview } from "@/lib/require-preview"
import Dashboard from "@/modules/staff/ui/Dashboard"
export default function Page() {
  if (isBackendEnabled())
    return staffPage(getStaffOverview, (data) => <DashboardRead data={data} />)
  requirePreview()
  return <Dashboard />
}
