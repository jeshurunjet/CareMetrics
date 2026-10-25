import { diaryHistory } from "@/server/diary/service"
import { scheduleQuery, scheduleResponse } from "@/server/scheduling/http"
import { AccessError } from "@/server/errors"
export const dynamic = "force-dynamic"
export async function GET(
  request: Request,
  context: RouteContext<"/api/admin/clients/[id]/diary/[entryId]">,
) {
  return scheduleResponse(async () => {
    if (Object.keys(scheduleQuery(request)).length) throw new AccessError(400)
    const { id, entryId } = await context.params
    return (await diaryHistory(id, { item: entryId }, true)).detail
  })
}
