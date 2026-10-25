import { managementMutation } from "@/server/admin/http"
import { editClient } from "@/server/admin/clients"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  return managementMutation(request, (body) => editClient(id, body))
}
