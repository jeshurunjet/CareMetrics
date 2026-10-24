import { requireEmployee } from "@/server/auth/access"
import { apiError, privateJson } from "@/server/errors"
export const dynamic = "force-dynamic"
export async function GET() {
  try {
    return privateJson(await requireEmployee())
  } catch (error) {
    return apiError(error)
  }
}
