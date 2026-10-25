import { carePage } from "@/server/care/service"
import { scheduleQuery, scheduleResponse } from "@/server/scheduling/http"
export const dynamic = "force-dynamic"
export async function GET(
  request: Request,
  context: RouteContext<"/api/clients/[id]/care-records">,
) {
  return scheduleResponse(async () =>
    carePage((await context.params).id, scheduleQuery(request), false, true),
  )
}
import { submitCare } from "@/server/care/service"
import { managementMutation } from "@/server/admin/http"
export async function POST(
  request: Request,
  context: RouteContext<"/api/clients/[id]/care-records">,
) {
  return managementMutation(
    request,
    async (body) => submitCare((await context.params).id, body),
    true,
  )
}
