import { managementMutation } from "@/server/admin/http"
import { transferClient } from "@/server/admin/clients"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  return managementMutation(request, (body) => transferClient(id, body))
}
