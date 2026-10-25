import { getAdminAttendanceHistory } from "@/server/attendance/history"
import { scheduleResponse } from "@/server/scheduling/http"
export const dynamic = "force-dynamic"
export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/admin/attendance/[id]">,
) {
  const { id } = await params
  return scheduleResponse(
    async () => (await getAdminAttendanceHistory({ attendanceId: id })).detail,
  )
}
