import "server-only"
import { Pool } from "pg"
import { attachDatabasePool } from "@vercel/functions"
import { databaseConnection } from "../config/database-url"
import { demoDeployment } from "../config/demo-deployment"
let pool: Pool | undefined
/** Separate credential has EXECUTE on the expiry-only function and no table privileges. */
export function retentionPool(): Pool {
  if (!demoDeployment()) throw new Error("Retention job unavailable")
  const main = new URL(process.env.DATABASE_URL ?? ""),
    raw = process.env.CAREMETRICS_LOCATION_PURGE_DATABASE_URL
  if (!raw) throw new Error("Retention job unavailable")
  const connection = databaseConnection(raw),
    target = new URL(connection)
  if (
    target.hostname.replace("-pooler.", ".") !==
      main.hostname.replace("-pooler.", ".") ||
    target.port !== main.port ||
    target.pathname !== main.pathname ||
    decodeURIComponent(target.username) !== "caremetrics_location_purger"
  )
    throw new Error("Retention job unavailable")
  if (!pool) {
    pool = new Pool({
      connectionString: connection,
      max: 1,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 10000,
    })
    pool.on("error", () => {
      /* No credentials, SQL values or location data in logs. */
    })
    if (process.env.VERCEL) attachDatabasePool(pool)
  }
  return pool
}
export async function purgeExpiredLocations() {
  const result = await retentionPool().query<{ purged: number }>(
    "SELECT public.purge_expired_demo_locations() AS purged",
  )
  return result.rows[0].purged
}
export async function nextLocationExpiry() {
  const result = await retentionPool().query<{ expiresAt: Date | null }>(
    'SELECT public.next_demo_location_expiry() AS "expiresAt"',
  )
  return result.rows[0].expiresAt?.getTime() ?? null
}
