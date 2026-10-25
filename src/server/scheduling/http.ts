import "server-only"
import { AccessError, apiError, privateJson } from "../errors"
export function scheduleQuery(request: Request) {
  const params = new URL(request.url).searchParams
  const result: Record<string, string> = {}
  for (const key of params.keys()) {
    if (params.getAll(key).length !== 1) throw new AccessError(400)
    result[key] = params.get(key)!
  }
  return result
}
export async function scheduleResponse(run: () => Promise<unknown>) {
  try {
    return privateJson(await run())
  } catch (error) {
    return apiError(error)
  }
}
