import { getStaffSchedule } from "@/server/scheduling/shifts"
import { staffPage } from "@/server/data/page"
import { getStaffOverview } from "@/server/data/staff"
import { DashboardRead } from "@/modules/staff/read/StaffReadViews"
import { isBackendEnabled } from "@/server/config/backend"
import { requirePreview } from "@/lib/require-preview"
import Dashboard from "@/modules/staff/ui/Dashboard"
export default function Page() {
  if (isBackendEnabled())
    return staffPage(
      async () => ({
        data: await getStaffOverview(),
        schedule: await getStaffSchedule(),
      }),
      (value) => <DashboardRead {...value} />,
    )
  requirePreview()
  return <Dashboard />
}
