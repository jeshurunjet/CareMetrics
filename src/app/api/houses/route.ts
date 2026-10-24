import { getAssignedHouses } from "@/server/data/access"
import { apiError, privateJson } from "@/server/errors"
export const dynamic = "force-dynamic"
export async function GET() {
  try {
    return privateJson(await getAssignedHouses())
  } catch (error) {
    return apiError(error)
  }
}
