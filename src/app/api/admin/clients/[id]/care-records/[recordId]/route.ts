import { careRecordDetail } from "@/server/care/service"
import { AccessError } from "@/server/errors"
import { scheduleQuery, scheduleResponse } from "@/server/scheduling/http"
export const dynamic = "force-dynamic"
export async function GET(
  request: Request,
  context: RouteContext<"/api/admin/clients/[id]/care-records/[recordId]">,
) {
  return scheduleResponse(async () => {
    const { id, recordId } = await context.params
    if (Object.keys(scheduleQuery(request)).length) throw new AccessError(400)
    return careRecordDetail(id, recordId, true)
  })
}
