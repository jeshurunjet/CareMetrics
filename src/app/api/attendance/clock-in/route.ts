import { mutationBody } from "@/server/admin/http"
import { apiError, AccessError, privateJson } from "@/server/errors"
import { clockIn, getClockInState } from "@/server/attendance/clock-in"
import { ClockInError } from "@/server/attendance/validation"
export const dynamic = "force-dynamic"
export async function POST(request: Request) {
  try {
    return privateJson(await clockIn(await mutationBody(request)))
  } catch (error) {
    if (error instanceof ClockInError)
      return Response.json({ error: error.message, code: error.code }, {
        status: error.status,
        headers: { "Cache-Control": "private, no-store", Vary: "Cookie" },
      })
    return apiError(error)
  }
}
export async function GET(request: Request) {
  try {
    const q = new URL(request.url).searchParams
    if (q.size !== 1 || q.getAll("shiftId").length !== 1)
      throw new AccessError(400)
    return privateJson(await getClockInState(q.get("shiftId")!))
  } catch (error) {
    return apiError(error)
  }
}
