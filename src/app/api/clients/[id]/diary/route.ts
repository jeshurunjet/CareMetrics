import { diaryHistory } from "@/server/diary/service"
import { scheduleQuery, scheduleResponse } from "@/server/scheduling/http"
export const dynamic = "force-dynamic"
export async function GET(
  request: Request,
  context: RouteContext<"/api/clients/[id]/diary">,
) {
  return scheduleResponse(async () =>
    diaryHistory((await context.params).id, scheduleQuery(request), false),
  )
}
import { submitDiary } from "@/server/diary/service"
import { managementMutation } from "@/server/admin/http"
export async function POST(
  request: Request,
  context: RouteContext<"/api/clients/[id]/diary">,
) {
  return managementMutation(request, async (body) =>
    submitDiary((await context.params).id, body),
  )
}
