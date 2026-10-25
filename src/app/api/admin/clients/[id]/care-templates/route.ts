import { carePage } from "@/server/care/service"
import { AccessError } from "@/server/errors"
import { scheduleQuery, scheduleResponse } from "@/server/scheduling/http"
export const dynamic = "force-dynamic"
export async function GET(
  request: Request,
  context: RouteContext<"/api/admin/clients/[id]/care-templates">,
) {
  return scheduleResponse(async () => {
    if (Object.keys(scheduleQuery(request)).length) throw new AccessError(400)
    return (await carePage((await context.params).id, {}, true)).categories
  })
}
