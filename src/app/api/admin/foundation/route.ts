import { requireCapability } from "@/server/auth/access"
import { apiError, privateJson } from "@/server/errors"
export const dynamic = "force-dynamic"
export async function GET() {
  try {
    await requireCapability("admin.foundation")
    return privateJson({ available: true, mutations: false })
  } catch (error) {
    return apiError(error)
  }
}
