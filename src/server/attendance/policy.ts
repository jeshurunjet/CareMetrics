import "server-only"
import { validCoordinates } from "../../modules/attendance/geo"
export interface ApprovedTestHouse {
  id: string
  latitude: number
  longitude: number
}
export interface AttendancePolicy {
  organisationId: string
  version: string
  approval: "test-only"
  enabled: true
  maxDistanceMetres: number
  maxAccuracyMetres: number
  maxAgeMs: number
  maxFutureSkewMs: number
  earlyWindowMs: number
  lateWindowMs: number
  boundaryRule: "entire-accuracy-circle-inside"
  houses: ApprovedTestHouse[]
}
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
const keys = [
  "organisationId",
  "version",
  "approval",
  "enabled",
  "maxDistanceMetres",
  "maxAccuracyMetres",
  "maxAgeMs",
  "maxFutureSkewMs",
  "earlyWindowMs",
  "lateWindowMs",
  "boundaryRule",
  "houses",
]
/** Server-controlled, tenant-scoped configuration. Production activation awaits separate approval. */
export function attendancePolicy(
  organisationId: string,
  env: Record<string, string | undefined> = process.env,
): AttendancePolicy | null {
  if (
    env.NODE_ENV === "production" ||
    env.VERCEL_ENV === "production" ||
    env.CAREMETRICS_GPS_TEST_POLICY_ACK !== "fictional-development-only" ||
    !["phase-2a", "local-test"].includes(env.NEON_BRANCH_NAME ?? "")
  )
    return null
  try {
    const rows: unknown = JSON.parse(env.CAREMETRICS_GPS_POLICIES ?? "null")
    if (!Array.isArray(rows)) return null
    const seen = new Set<string>()
    for (const value of rows) {
      if (!value || typeof value !== "object" || Array.isArray(value))
        return null
      const p = value as Record<string, unknown>
      if (
        Object.keys(p).length !== keys.length ||
        Object.keys(p).some((k) => !keys.includes(k)) ||
        typeof p.organisationId !== "string" ||
        !uuid.test(p.organisationId) ||
        seen.has(p.organisationId)
      )
        return null
      seen.add(p.organisationId)
      if (
        p.enabled !== true ||
        p.approval !== "test-only" ||
        typeof p.version !== "string" ||
        !/^test-[a-zA-Z0-9._-]{1,75}$/.test(p.version) ||
        p.boundaryRule !== "entire-accuracy-circle-inside"
      )
        return null
      for (const name of [
        "maxDistanceMetres",
        "maxAccuracyMetres",
        "maxAgeMs",
        "maxFutureSkewMs",
        "earlyWindowMs",
        "lateWindowMs",
      ]) {
        const n = p[name]
        if (
          typeof n !== "number" ||
          !Number.isFinite(n) ||
          n < 0 ||
          (name.endsWith("Ms") && !Number.isSafeInteger(n))
        )
          return null
      }
      if (
        p.maxDistanceMetres === 0 ||
        p.maxAgeMs === 0 ||
        !Array.isArray(p.houses) ||
        !p.houses.length
      )
        return null
      const houses = new Set<string>()
      for (const h of p.houses) {
        if (
          !h ||
          typeof h !== "object" ||
          Array.isArray(h) ||
          Object.keys(h).sort().join(",") !== "id,latitude,longitude" ||
          typeof h.id !== "string" ||
          !uuid.test(h.id) ||
          houses.has(h.id) ||
          !validCoordinates(h.latitude, h.longitude)
        )
          return null
        houses.add(h.id)
      }
    }
    return (
      rows.find(
        (p) => p.organisationId === organisationId,
      ) as AttendancePolicy | undefined ?? null
    )
  } catch {
    return null
  }
}
