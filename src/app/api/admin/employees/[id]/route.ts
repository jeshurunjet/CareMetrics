import { managementMutation } from "@/server/admin/http"
import { editEmployee } from "@/server/admin/employees"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  return managementMutation(request, (body) => editEmployee(id, body))
}
