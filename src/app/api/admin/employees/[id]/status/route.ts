import { managementMutation } from "@/server/admin/http"
import { setEmployeeStatus } from "@/server/admin/employees"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  return managementMutation(request, (body) => setEmployeeStatus(id, body))
}
