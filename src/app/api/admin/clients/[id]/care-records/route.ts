import { carePage } from "@/server/care/service"
import { scheduleQuery, scheduleResponse } from "@/server/scheduling/http"
export const dynamic = "force-dynamic"
export async function GET(
  request: Request,
  context: RouteContext<"/api/admin/clients/[id]/care-records">,
) {
  return scheduleResponse(async () =>
    carePage((await context.params).id, scheduleQuery(request), true, true),
  )
}
