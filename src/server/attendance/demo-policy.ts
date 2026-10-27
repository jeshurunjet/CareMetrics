import "server-only"
import { RETENTION_METADATA_CACHE_MS } from "./retention-poll"
import { demoDeployment } from "../config/demo-deployment"
export const GPS_RECORDING_DEMO = "GPS_LOCATION_RECORDED_DEMO" as const
export const LOCATION_RETENTION_MS = 7 * 24 * 60 * 60 * 1000
export interface DemoAttendancePolicy {
  mode: typeof GPS_RECORDING_DEMO
  organisationId: string
  version: string
  approval: "fictional-demo"
  enabled: true
  maxAccuracyMetres: number
  maxAgeMs: number
  maxFutureSkewMs: number
  earlyWindowMs: number
  lateWindowMs: number
  retentionDays: 7
  clockOutMode: "NO_LOCATION_REQUIRED"
}
/** All limits are explicit server settings; no client flag or fallback numbers. */
export function demoAttendancePolicy(
  organisationId: string,
  env: Record<string, string | undefined> = process.env,
): DemoAttendancePolicy | null {
  if (
    !demoDeployment(env) ||
    env.CAREMETRICS_DEMO_ORGANISATION_ID !== organisationId
  )
    return null
  try {
    const p = JSON.parse(
      env.CAREMETRICS_DEMO_GPS_POLICY ?? "null",
    ) as Record<string, unknown> | null
    const keys = [
      "mode",
      "organisationId",
      "version",
      "approval",
      "enabled",
      "maxAccuracyMetres",
      "maxAgeMs",
      "maxFutureSkewMs",
      "earlyWindowMs",
      "lateWindowMs",
      "retentionDays",
      "clockOutMode",
    ]
    if (
      !p ||
      Array.isArray(p) ||
      Object.keys(p).length !== keys.length ||
      Object.keys(p).some((k) => !keys.includes(k)) ||
      p.organisationId !== organisationId ||
      !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
        organisationId,
      ) ||
      p.mode !== GPS_RECORDING_DEMO ||
      p.approval !== "fictional-demo" ||
      p.enabled !== true ||
      p.retentionDays !== 7 ||
      p.clockOutMode !== "NO_LOCATION_REQUIRED" ||
      typeof p.version !== "string" ||
      !/^demo-[a-zA-Z0-9._-]{1,65}$/.test(p.version)
    )
      return null
    for (const k of [
      "maxAccuracyMetres",
      "maxAgeMs",
      "maxFutureSkewMs",
      "earlyWindowMs",
      "lateWindowMs",
    ]) {
      const n = p[k]
      if (
        typeof n !== "number" ||
        !Number.isFinite(n) ||
        n < 0 ||
        (k.endsWith("Ms") && !Number.isSafeInteger(n))
      )
        return null
    }
    if (p.maxAgeMs as number <= 0 || p.maxAccuracyMetres as number <= 0)
      return null
    // Cached negative expiry checks remain safe: newly accepted measurements
    // cannot introduce an expiry inside the metadata cache horizon.
    if (
      p.maxAgeMs as number >
      LOCATION_RETENTION_MS - 2 * RETENTION_METADATA_CACHE_MS
    )
      return null
    return p as unknown as DemoAttendancePolicy
  } catch {
    return null
  }
}
export function isRecordingDemo(
  p: { mode?: string } | object,
): p is DemoAttendancePolicy {
  return "mode" in p && p.mode === GPS_RECORDING_DEMO
}
