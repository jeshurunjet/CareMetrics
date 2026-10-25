import { managementMutation } from "@/server/admin/http"
import { createHouse } from "@/server/admin/houses"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export async function POST(request: Request) {
  return managementMutation(request, (body) => createHouse(body))
}
