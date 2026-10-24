import { staffPage } from "@/server/data/page"
import { getStaffOverview } from "@/server/data/staff"
import { HousesRead } from "@/modules/staff/read/StaffReadViews"
import { isBackendEnabled } from "@/server/config/backend"
import { requirePreview } from "@/lib/require-preview"
import HouseList from "@/modules/staff/ui/HouseList"
export default function Page() {
  if (isBackendEnabled())
    return staffPage(getStaffOverview, (data) => (
      <HousesRead houses={data.houses} />
    ))
  requirePreview()
  return <HouseList />
}
