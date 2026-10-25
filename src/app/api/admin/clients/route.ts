import { managementMutation } from "@/server/admin/http"
import { createClient } from "@/server/admin/clients"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export async function POST(request: Request) {
  return managementMutation(request, (body) => createClient(body))
}
