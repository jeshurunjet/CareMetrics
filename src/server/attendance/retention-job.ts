import "server-only"
import { getCache } from "@vercel/functions"
import {
  retentionPool,
  nextLocationExpiry,
  purgeExpiredLocations,
} from "./purge"
import { retentionPoll, RETENTION_METADATA_CACHE_MS } from "./retention-poll"
import { DEMO_TARGET } from "../config/demo-deployment"
export async function runLocationRetention(force = false) {
  retentionPool() // Validate pinned demo/credential configuration without connecting.
  const cache = getCache({
    namespace: DEMO_TARGET.vercelProjectId + ":retention-v1",
  })
  const key = DEMO_TARGET.databaseHost + ":" + DEMO_TARGET.databaseName
  return retentionPoll(
    {
      now: Date.now,
      readCache: () => cache.get(key),
      writeCache: (value) =>
        cache.set(key, value, { ttl: RETENTION_METADATA_CACHE_MS / 1000 }),
      clearCache: () => cache.delete(key),
      nextExpiry: nextLocationExpiry,
      purge: purgeExpiredLocations,
    },
    force,
  )
}
