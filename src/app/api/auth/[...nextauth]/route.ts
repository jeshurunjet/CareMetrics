import { requireEmployee } from "@/server/auth/access"
import { NextRequest } from "next/server"
import { handlers } from "@/server/auth"
import { backendEnvironment } from "@/server/config/backend"
import { apiError, AccessError } from "@/server/errors"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
async function handle(request: Request) {
  try {
    const config = backendEnvironment()
    if (new URL(request.url).origin !== config.origin)
      throw new AccessError(403)
    if (
      request.method === "POST" &&
      request.headers.get("origin") !== config.origin
    )
      throw new AccessError(403)
    // Do not pass browser-supplied proxy host metadata to Auth.js.
    const headers = new Headers(request.headers)
    headers.delete("x-forwarded-host")
    headers.delete("x-forwarded-proto")
    headers.set("host", new URL(config.origin).host)
    const input = new NextRequest(request, { headers })
    const response = await (request.method === "GET"
      ? handlers.GET(input)
      : handlers.POST(input))
    if (
      new URL(request.url).pathname.endsWith("/session") &&
      request.method === "GET"
    ) {
      try {
        await requireEmployee()
      } catch (error) {
        if (error instanceof AccessError && error.status === 401)
          return Response.json(null, {
            headers: { "Cache-Control": "private, no-store" },
          })
        throw error
      }
    }
    response.headers.set("Cache-Control", "private, no-store")
    return response
  } catch (error) {
    return apiError(error)
  }
}
export { handle as GET, handle as POST }
