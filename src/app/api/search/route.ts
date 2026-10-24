import { searchStaff } from "@/server/data/staff"
import { apiError, privateJson, AccessError } from "@/server/errors"
export const dynamic = "force-dynamic"
export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams
    if (query.getAll("q").length > 1) throw new AccessError(400)
    return privateJson(await searchStaff(query.get("q")))
  } catch (error) {
    return apiError(error)
  }
}
