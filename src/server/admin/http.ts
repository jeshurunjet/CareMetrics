import "server-only"
import { backendEnvironment } from "../config/backend"
import { apiError, privateJson, AccessError } from "../errors"
import { ManagementError } from "./validation"
export async function managementMutation(
  request: Request,
  operation: (body: unknown) => Promise<unknown>,
) {
  try {
    const body = await mutationBody(request)
    return privateJson(await operation(body))
  } catch (error) {
    if (error instanceof ManagementError)
      return Response.json({ error: error.message, fields: error.fields }, {
        status: error.status,
        headers: { "Cache-Control": "private, no-store", Vary: "Cookie" },
      })
    return apiError(error)
  }
}

export async function mutationBody(request: Request): Promise<unknown> {
  const config = backendEnvironment()
  if (
    new URL(request.url).origin !== config.origin ||
    request.headers.get("origin") !== config.origin ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new AccessError(403)
  if (
    request.headers.get("content-type")?.split(";")[0].trim() !==
    "application/json"
  )
    throw new AccessError(400)
  const reader = request.body?.getReader()
  if (!reader) throw new AccessError(400)
  const chunks: Uint8Array[] = []
  let size = 0
  while (true) {
    const next = await reader.read()
    if (next.done) break
    size += next.value.byteLength
    if (size > 32768) {
      await reader.cancel()
      throw new AccessError(400)
    }
    chunks.push(next.value)
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  let body: unknown
  try {
    body = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes))
  } catch {
    throw new AccessError(400)
  }
  return body
}
