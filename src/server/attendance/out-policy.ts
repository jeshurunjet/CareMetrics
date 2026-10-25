import "server-only"
import type { ClockOutAvailability } from "../../modules/attendance/types"
export interface ClockOutPolicy {
  organisationId: string
  version: string
  approval: "test-only"
  enabled: true
  mode: "NO_LOCATION_REQUIRED" | "LOCATION_REQUIRED" | "UNCONFIGURED"
}
export function clockOutPolicy(
  organisationId: string,
  env: Record<string, string | undefined> = process.env,
): ClockOutPolicy | null {
  if (
    env.NODE_ENV === "production" ||
    env.VERCEL_ENV === "production" ||
    env.CAREMETRICS_CLOCK_OUT_TEST_POLICY_ACK !==
      "fictional-development-only" ||
    !["local-test", "phase-2a"].includes(env.NEON_BRANCH_NAME ?? "")
  )
    return null
  try {
    const rows: unknown = JSON.parse(
      env.CAREMETRICS_CLOCK_OUT_POLICIES ?? "null",
    )
    if (!Array.isArray(rows)) return null
    const seen = new Set<string>(),
      uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
    for (const raw of rows) {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null
      const p = raw as Record<string, unknown>
      if (
        Object.keys(p).sort().join(",") !==
          "approval,enabled,mode,organisationId,version" ||
        typeof p.organisationId !== "string" ||
        !uuid.test(p.organisationId) ||
        seen.has(p.organisationId) ||
        p.approval !== "test-only" ||
        p.enabled !== true ||
        typeof p.version !== "string" ||
        !/^test-[a-zA-Z0-9._-]{1,75}$/.test(p.version) ||
        typeof p.mode !== "string" ||
        !["UNCONFIGURED", "NO_LOCATION_REQUIRED", "LOCATION_REQUIRED"].includes(
          p.mode,
        )
      )
        return null
      seen.add(p.organisationId)
    }
    return (
      rows.find(
        (p) => p.organisationId === organisationId,
      ) as ClockOutPolicy | undefined ?? null
    )
  } catch {
    return null
  }
}
export function clockOutAvailability(
  organisationId: string,
  clockIn: Date | null,
  clockOut: Date | null,
): ClockOutAvailability {
  if (clockOut)
    return {
      available: false,
      mode: "UNCONFIGURED",
      code: "CLOCKED_OUT",
      message: "Clocked Out",
      testOnly: false,
    }
  if (!clockIn)
    return {
      available: false,
      mode: "UNCONFIGURED",
      code: "NO_OPEN_ATTENDANCE",
      message: "No open recorded clock-in. Contact Management.",
      testOnly: false,
    }
  const p = clockOutPolicy(organisationId)
  if (!p || p.mode === "UNCONFIGURED")
    return {
      available: false,
      mode: "UNCONFIGURED",
      code: "CLOCK_OUT_POLICY_UNAVAILABLE",
      message:
        "Clock-out policy requires management attention. Contact Management.",
      testOnly: false,
    }
  if (p.mode === "LOCATION_REQUIRED")
    return {
      available: false,
      mode: p.mode,
      code: "CLOCK_OUT_LOCATION_REQUIRED",
      message:
        "GPS-required clock-out verification is not approved or available. Contact Management.",
      testOnly: true,
    }
  return {
    available: true,
    mode: p.mode,
    code: "AVAILABLE",
    message: "Development test policy: no location is collected for clock-out.",
    testOnly: true,
  }
}
