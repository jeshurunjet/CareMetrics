import { requireClient } from "@/server/data/access"
import { apiError, privateJson } from "@/server/errors"
export const dynamic = "force-dynamic"
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    return privateJson(await requireClient((await params).id))
  } catch (error) {
    return apiError(error)
  }
}
