import { getAdminAttendanceHistory } from "@/server/attendance/history"
import { scheduleQuery, scheduleResponse } from "@/server/scheduling/http"
export const dynamic = "force-dynamic"
export async function GET(request: Request) {
  return scheduleResponse(() =>
    getAdminAttendanceHistory(scheduleQuery(request)),
  )
}
