// Pure scheduling gate: cache contains aggregate expiry/time only, never identity or coordinates.
export const RETENTION_METADATA_CACHE_MS = 60 * 60 * 1000
export interface RetentionMetadata {
  checkedAt: number
  expiresAt: number | null
}
export interface RetentionPollDependencies {
  now: () => number
  readCache: () => Promise<unknown>
  writeCache: (value: RetentionMetadata) => Promise<void>
  clearCache: () => Promise<void>
  nextExpiry: () => Promise<number | null>
  purge: () => Promise<number>
}
function freshMetadata(
  value: unknown,
  now: number,
): value is RetentionMetadata {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const v = value as Record<string, unknown>
  return (
    Object.keys(v).length === 2 &&
    typeof v.checkedAt === "number" &&
    Number.isFinite(v.checkedAt) &&
    v.checkedAt <= now &&
    now - v.checkedAt < RETENTION_METADATA_CACHE_MS &&
    (v.expiresAt === null ||
      (typeof v.expiresAt === "number" &&
        Number.isFinite(v.expiresAt) &&
        v.expiresAt > 0))
  )
}
export async function retentionPoll(
  d: RetentionPollDependencies,
  force = false,
) {
  let metadata = force ? null : await d.readCache()
  const cached = freshMetadata(metadata, d.now())
  if (!cached) {
    const expiresAt = await d.nextExpiry()
    if (expiresAt !== null && (!Number.isFinite(expiresAt) || expiresAt <= 0))
      throw Error("Retention metadata unavailable")
    metadata = { checkedAt: d.now(), expiresAt }
    // A failed shared-cache write must be visible, rather than silently keeping Neon awake.
    await d.writeCache(metadata as RetentionMetadata)
  }
  const expiresAt = (metadata as RetentionMetadata).expiresAt
  if (expiresAt === null || expiresAt > d.now())
    return { purged: 0, check: cached ? "cached-wait" : "checked-wait" }
  const purged = await d.purge()
  await d.clearCache()
  return { purged, check: "purged-check" }
}
