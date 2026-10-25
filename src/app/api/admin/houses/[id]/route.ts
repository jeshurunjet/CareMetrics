import { managementMutation } from "@/server/admin/http"
import { editHouse } from "@/server/admin/houses"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  return managementMutation(request, (body) => editHouse(id, body))
}
