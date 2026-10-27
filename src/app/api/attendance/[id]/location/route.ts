import { getAttendanceLocation } from "@/server/attendance/location"
import { AccessError } from "@/server/errors"
import { scheduleQuery, scheduleResponse } from "@/server/scheduling/http"
export const dynamic = "force-dynamic"
export async function GET(
  request: Request,
  context: RouteContext<"/api/attendance/[id]/location">,
) {
  return scheduleResponse(async () => {
    if (Object.keys(scheduleQuery(request)).length) throw new AccessError(400)
    const { id } = await context.params
    return getAttendanceLocation(id, false)
  })
}
