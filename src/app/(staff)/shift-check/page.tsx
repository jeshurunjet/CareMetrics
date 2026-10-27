import { requireEmployee } from "@/server/auth/access"
import { database } from "@/server/db"
import { googleMapsDemoConfiguration } from "@/server/config/google-maps-demo"
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
      async () => {
        const data = await getStaffSchedule(q),
          actor = await requireEmployee()
        const org = await database().organisation.findUnique({
          where: { id: actor.organisationId },
          select: { isFictionalDemo: true },
        })
        return {
          data,
          googleDemo: googleMapsDemoConfiguration(
            actor.organisationId,
            org?.isFictionalDemo === true,
          ),
        }
      },
      ({ data, googleDemo }) => (
        <StaffScheduleView data={data} googleDemo={googleDemo} view="shifts" />
      ),
    )
  }
  requirePreview()
  return <ClockIn />
}
