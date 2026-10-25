import { diaryHistory } from "@/server/diary/service"
import { scheduleQuery, scheduleResponse } from "@/server/scheduling/http"
export const dynamic = "force-dynamic"
export async function GET(
  request: Request,
  context: RouteContext<"/api/admin/clients/[id]/diary">,
) {
  return scheduleResponse(async () =>
    diaryHistory((await context.params).id, scheduleQuery(request), true),
  )
}
