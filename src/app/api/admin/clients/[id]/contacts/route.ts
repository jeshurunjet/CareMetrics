import { managementMutation } from "@/server/admin/http"
import { saveClientContacts } from "@/server/admin/clients"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  return managementMutation(request, (body) => saveClientContacts(id, body))
}
