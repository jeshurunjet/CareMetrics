import { careEditor } from "@/server/care/service"
import { AccessError } from "@/server/errors"
import { scheduleQuery, scheduleResponse } from "@/server/scheduling/http"
export const dynamic = "force-dynamic"
export async function GET(
  request: Request,
  context: RouteContext<"/api/clients/[id]/care-templates/[templateId]">,
) {
  return scheduleResponse(async () => {
    const { id, templateId } = await context.params
    if (Object.keys(scheduleQuery(request)).length) throw new AccessError(400)
    return careEditor(id, templateId)
  })
}
