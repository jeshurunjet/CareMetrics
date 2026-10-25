import { managementMutation } from "@/server/admin/http"
import { cancelShift } from "@/server/scheduling/shifts"
export const dynamic = "force-dynamic"
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  return managementMutation(request, (body) => cancelShift(id, body))
}
