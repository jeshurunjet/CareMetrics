import { carePage } from "@/server/care/service"
import { AccessError } from "@/server/errors"
import { scheduleQuery, scheduleResponse } from "@/server/scheduling/http"
export const dynamic = "force-dynamic"
export async function GET(
  request: Request,
  context: RouteContext<"/api/admin/clients/[id]/care-templates/[templateId]">,
) {
  return scheduleResponse(async () => {
    const { id, templateId } = await context.params
    const q = scheduleQuery(request)
    if (Object.keys(q).some((k) => k !== "version")) throw new AccessError(400)
    return (await carePage(id, { ...q, sub: templateId }, true)).publishedForm
  })
}
