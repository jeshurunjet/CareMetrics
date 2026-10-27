export class AccessError extends Error {
  constructor(public readonly status: 400 | 401 | 403 | 404 | 429 | 503) {
    super("Request unavailable")
  }
}
export function apiError(error: unknown): Response {
  const status = error instanceof AccessError ? error.status : 503
  const message = {
    400: "Invalid request",
    401: "Sign in required",
    403: "Access unavailable",
    404: "Record unavailable",
    503: "Service unavailable",
    429: "Too many requests. Please try again shortly.",
  }[status]
  return Response.json({ error: message }, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  })
}
export function privateJson(data: unknown): Response {
  return Response.json(data, {
    headers: { "Cache-Control": "private, no-store", Vary: "Cookie" },
  })
}
export function entityId(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
    throw new AccessError(400)
  return value
}
