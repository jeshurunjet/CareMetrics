import { databaseConnection } from "./database-url"
export function isBackendEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return env.CAREMETRICS_BACKEND_MODE === "database"
}
export function backendEnvironment(
  env: Record<string, string | undefined> = process.env,
) {
  if (!isBackendEnabled(env)) throw new Error("Backend unavailable")
  const secret = env.AUTH_SECRET
  const origin = env.AUTH_URL
  const databaseUrl = env.DATABASE_URL
  if (!secret || secret.length < 32 || !origin || !databaseUrl)
    throw new Error("Backend unavailable")
  let app: URL
  try {
    app = new URL(origin)
  } catch {
    throw new Error("Backend unavailable")
  }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(app.hostname)
  if (
    app.username ||
    app.password ||
    app.pathname !== "/" ||
    app.search ||
    app.hash ||
    (app.protocol !== "https:" &&
      !(env.NODE_ENV !== "production" && local && app.protocol === "http:"))
  )
    throw new Error("Backend unavailable")
  return {
    secret,
    origin: app.origin,
    databaseUrl: databaseConnection(databaseUrl),
  }
}
