import { getStaffSchedule } from "@/server/scheduling/shifts"
import { scheduleQuery, scheduleResponse } from "@/server/scheduling/http"
export const dynamic = "force-dynamic"
export async function GET(request: Request) {
  return scheduleResponse(() => getStaffSchedule(scheduleQuery(request)))
}
