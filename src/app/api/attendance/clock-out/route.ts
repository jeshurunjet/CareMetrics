import { mutationBody } from "@/server/admin/http"
import { apiError, privateJson } from "@/server/errors"
import { clockOut } from "@/server/attendance/clock-out"
import { ClockInError } from "@/server/attendance/validation"
export async function POST(request: Request) {
  try {
    return privateJson(await clockOut(await mutationBody(request)))
  } catch (error) {
    if (error instanceof ClockInError)
      return Response.json({ error: error.message, code: error.code }, {
        status: error.status,
        headers: { "Cache-Control": "private, no-store", Vary: "Cookie" },
      })
    return apiError(error)
  }
}
