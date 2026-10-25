import { getAdminSchedule } from "@/server/scheduling/shifts"
import { scheduleResponse } from "@/server/scheduling/http"
export const dynamic = "force-dynamic"
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  return scheduleResponse(
    async () => (await getAdminSchedule({ shiftId: id })).detail,
  )
}
import { managementMutation } from "@/server/admin/http"
import { saveShift } from "@/server/scheduling/shifts"
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  return managementMutation(request, (body) => saveShift(body, id))
}
