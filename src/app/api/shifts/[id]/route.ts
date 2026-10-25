import { getStaffSchedule } from "@/server/scheduling/shifts"
import { scheduleResponse } from "@/server/scheduling/http"
export const dynamic = "force-dynamic"
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  return scheduleResponse(
    async () => (await getStaffSchedule({ shiftId: id })).detail,
  )
}
