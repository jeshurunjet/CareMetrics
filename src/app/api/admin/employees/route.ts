import { managementMutation } from "@/server/admin/http"
import { createEmployee } from "@/server/admin/employees"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export async function POST(request: Request) {
  return managementMutation(request, (body) => createEmployee(body))
}
