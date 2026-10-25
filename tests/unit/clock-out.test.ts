import { describe, it, expect, vi } from "vitest"
vi.mock("server-only", () => ({}))
import fixture from "../fixtures/clock-out-policy.json"
import {
  clockOutPolicy,
  clockOutAvailability,
} from "../../src/server/attendance/out-policy"
import {
  elapsedMilliseconds,
  formatElapsed,
  attendanceInstant,
} from "../../src/modules/attendance/duration"
const env = {
  NODE_ENV: "test",
  NEON_BRANCH_NAME: "local-test",
  CAREMETRICS_CLOCK_OUT_TEST_POLICY_ACK: "fictional-development-only",
  CAREMETRICS_CLOCK_OUT_POLICIES: JSON.stringify([fixture]),
}
describe("explicit clock-out policy", () => {
  it("accepts only deliberately acknowledged tenant test configuration", () => {
    expect(clockOutPolicy(fixture.organisationId, env)?.mode).toBe(
      "NO_LOCATION_REQUIRED",
    )
    for (const patch of [
      { NODE_ENV: "production" },
      { VERCEL_ENV: "production" },
      { NEON_BRANCH_NAME: "production" },
      { CAREMETRICS_CLOCK_OUT_TEST_POLICY_ACK: "" },
      { CAREMETRICS_CLOCK_OUT_POLICIES: "" },
      { CAREMETRICS_CLOCK_OUT_POLICIES: "{" },
    ])
      expect(
        clockOutPolicy(fixture.organisationId, { ...env, ...patch }),
      ).toBeNull()
    expect(
      clockOutPolicy("22000000-0000-4000-8000-000000000002", env),
    ).toBeNull()
  })
  it.each(["organisationId", "version", "approval", "mode", "enabled"])(
    "rejects missing/invalid %s",
    (key) => {
      const missing: Record<string, unknown> = { ...fixture }
      delete missing[key]
      for (const value of [missing, { ...fixture, [key]: null }])
        expect(
          clockOutPolicy(fixture.organisationId, {
            ...env,
            CAREMETRICS_CLOCK_OUT_POLICIES: JSON.stringify([value]),
          }),
        ).toBeNull()
    },
  )
  it("does not promote location-required or unconfigured modes into no-location approval", () => {
    for (const mode of ["UNCONFIGURED", "LOCATION_REQUIRED"]) {
      expect(
        clockOutPolicy(fixture.organisationId, {
          ...env,
          CAREMETRICS_CLOCK_OUT_POLICIES: JSON.stringify([
            { ...fixture, mode },
          ]),
        })?.mode,
      ).toBe(mode)
    }
    for (const rows of [
      [fixture, fixture],
      [{ ...fixture, approval: "approved" }],
      [{ ...fixture, enabled: false }],
      [{ ...fixture, mode: "optional" }],
      [{ ...fixture, gpsOptional: true }],
    ])
      expect(
        clockOutPolicy(fixture.organisationId, {
          ...env,
          CAREMETRICS_CLOCK_OUT_POLICIES: JSON.stringify(rows),
        }),
      ).toBeNull()
  })
  it("completed and missing clock-in records never expose a new action", () => {
    const now = new Date()
    expect(
      clockOutAvailability(fixture.organisationId, null, null),
    ).toMatchObject({ available: false, code: "NO_OPEN_ATTENDANCE" })
    expect(
      clockOutAvailability(fixture.organisationId, now, now),
    ).toMatchObject({ available: false, code: "CLOCKED_OUT" })
  })
})
describe("actual UTC elapsed attendance", () => {
  it.each([
    ["2026-12-31T09:00:00Z", "2026-12-31T17:00:00Z", 8],
    ["2027-09-25T13:00:00Z", "2027-09-25T15:00:00Z", 2],
    ["2027-04-03T12:00:00Z", "2027-04-03T16:00:00Z", 4],
    ["2026-10-25T10:00:00Z", "2026-10-25T18:30:00Z", 8.5],
  ])(
    "calculates overnight/year/DST %s without wall-clock subtraction",
    (start, end, hours) => {
      expect(elapsedMilliseconds(start, end)).toBe(hours * 3600000)
    },
  )
  it.each([
    [null, null],
    ["bad", "bad"],
    ["2026-10-25T10:00:00Z", null],
    ["2026-10-25T11:00:00Z", "2026-10-25T10:00:00Z"],
  ])("does not invent duration for %s / %s", (a, b) =>
    expect(elapsedMilliseconds(a, b)).toBeNull(),
  )
  it("keeps positive sub-minute events distinct from zero and shows whole hours/minutes", () => {
    expect(formatElapsed(1)).toBe("<1 min")
    expect(formatElapsed(0)).toBe("0h 0m")
    expect(formatElapsed(8.5 * 3600000)).toBe("8h 30m")
    for (const n of [null, -1, NaN, Infinity])
      expect(formatElapsed(n)).toBe("—")
  })
  it("presents actual instants in NZ including date/year rather than device timezone", () => {
    expect(attendanceInstant("2026-12-31T12:30:00Z")).toContain("2027")
    expect(attendanceInstant("2026-12-31T12:30:00Z")).toContain("01:30")
    expect(attendanceInstant(null)).toBe("—")
  })
})
