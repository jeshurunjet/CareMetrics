import { getAdminSchedule } from "@/server/scheduling/shifts"
import { scheduleQuery, scheduleResponse } from "@/server/scheduling/http"
export const dynamic = "force-dynamic"
export async function GET(request: Request) {
  return scheduleResponse(() => getAdminSchedule(scheduleQuery(request)))
}
import { managementMutation } from "@/server/admin/http"
import { saveShift } from "@/server/scheduling/shifts"
export async function POST(request: Request) {
  return managementMutation(request, (body) => saveShift(body))
}
