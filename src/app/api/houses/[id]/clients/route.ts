import { requireHouse, getHouseClients } from "@/server/data/access"
import { apiError, privateJson } from "@/server/errors"
export const dynamic = "force-dynamic"
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    await requireHouse(id)
    return privateJson(await getHouseClients(id))
  } catch (error) {
    return apiError(error)
  }
}
