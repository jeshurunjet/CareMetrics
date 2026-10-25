import StaffScheduleView from "@/modules/scheduling/StaffSchedule"
import { staffPage } from "@/server/data/page"
import { getStaffSchedule } from "@/server/scheduling/shifts"
import { isBackendEnabled } from "@/server/config/backend"
import { requirePreview } from "@/lib/require-preview"
import ClockIn from "@/modules/staff/ui/ClockIn"
export default async function Page({
  searchParams,
}: PageProps<"/shift-check">) {
  if (isBackendEnabled()) {
    const q = await searchParams
    return staffPage(
      () => getStaffSchedule(q),
      (data) => <StaffScheduleView data={data} view="shifts" />,
    )
  }
  requirePreview()
  return <ClockIn />
}
