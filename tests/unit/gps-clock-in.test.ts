import { describe, it, expect, vi, afterEach } from "vitest"
vi.mock("server-only", () => ({}))
import fixture from "../fixtures/gps-policy.json"
import { attendancePolicy } from "../../src/server/attendance/policy"
import {
  clockInInput,
  eligible,
  verifyPosition,
} from "../../src/server/attendance/validation"
import {
  distanceMetres,
  validCoordinates,
} from "../../src/modules/attendance/geo"
import { capturePosition } from "../../src/modules/attendance/browser"
const env = {
  NODE_ENV: "test",
  NEON_BRANCH_NAME: "local-test",
  CAREMETRICS_GPS_TEST_POLICY_ACK: "fictional-development-only",
  CAREMETRICS_GPS_POLICIES: JSON.stringify([fixture]),
}
const policy = () => attendancePolicy(fixture.organisationId, env)!
const value = () => ({
  shiftId: "21000000-0000-4000-8000-000000000051",
  requestId: "21000000-0000-4000-8000-000000000061",
  latitude: -36.85,
  longitude: 174.76,
  accuracyMetres: 5,
  measuredAt: 1800000000000,
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})
describe("GPS geometry and fail-closed policy", () => {
  it("uses metres, handles identical, local, antipodal and dateline coordinates without rounding acceptance", () => {
    expect(distanceMetres(-36.85, 174.76, -36.85, 174.76)).toBe(0)
    expect(distanceMetres(0, 0, 0, 0.001)).toBeCloseTo(111.19508, 4)
    expect(distanceMetres(0, 179.999, 0, -179.999)).toBeCloseTo(222.39016, 4)
    expect(distanceMetres(0, 0, 0, 180)).toBeCloseTo(Math.PI * 6371008.8, 5)
    expect(distanceMetres(90, 0, 90, 180)).toBeLessThan(0.000001)
  })
  it.each([NaN, Infinity, -Infinity, "0", null, undefined, 91])(
    "rejects invalid latitude %s",
    (n) => {
      expect(validCoordinates(n, 0)).toBe(false)
      expect(distanceMetres(n as number, 0, 0, 0)).toBeNull()
    },
  )
  it.each([NaN, Infinity, -181, 181, "174.76", null])(
    "rejects invalid longitude %s",
    (n) => expect(validCoordinates(0, n)).toBe(false),
  )
  it("requires explicit tenant/test acknowledgement and never activates production", () => {
    expect(policy()).toMatchObject({ approval: "test-only" })
    for (const patch of [
      { NODE_ENV: "production" },
      { VERCEL_ENV: "production" },
      { NEON_BRANCH_NAME: "production" },
      { CAREMETRICS_GPS_TEST_POLICY_ACK: "" },
      { CAREMETRICS_GPS_POLICIES: "" },
    ])
      expect(
        attendancePolicy(fixture.organisationId, { ...env, ...patch }),
      ).toBeNull()
    expect(
      attendancePolicy("21000000-0000-4000-8000-000000000002", env),
    ).toBeNull()
  })
  it.each([
    "maxDistanceMetres",
    "maxAccuracyMetres",
    "maxAgeMs",
    "maxFutureSkewMs",
    "earlyWindowMs",
    "lateWindowMs",
    "boundaryRule",
    "enabled",
    "approval",
    "version",
    "houses",
  ])("fails closed if %s is absent or invalid", (key) => {
    const missing: Record<string, unknown> = { ...fixture }
    delete missing[key]
    expect(
      attendancePolicy(fixture.organisationId, {
        ...env,
        CAREMETRICS_GPS_POLICIES: JSON.stringify([missing]),
      }),
    ).toBeNull()
    expect(
      attendancePolicy(fixture.organisationId, {
        ...env,
        CAREMETRICS_GPS_POLICIES: JSON.stringify([{ ...fixture, [key]: null }]),
      }),
    ).toBeNull()
  })
  it("rejects duplicate tenants, unknown rules, invalid house coordinates and negative/nonfinite settings", () => {
    for (const rows of [
      [fixture, fixture],
      [{ ...fixture, extra: true }],
      [{ ...fixture, boundaryRule: "point-only" }],
      [{ ...fixture, houses: [{ ...fixture.houses[0], latitude: 100 }] }],
      [{ ...fixture, maxAgeMs: -1 }],
      [{ ...fixture, maxDistanceMetres: 0 }],
    ])
      expect(
        attendancePolicy(fixture.organisationId, {
          ...env,
          CAREMETRICS_GPS_POLICIES: JSON.stringify(rows),
        }),
      ).toBeNull()
  })
})
describe("measurement and eligibility boundaries", () => {
  it("accepts exact zero-accuracy boundary and rejects uncertain/outside cases without favourable rounding", () => {
    const d = value(),
      p = policy()
    p.maxDistanceMetres = 5
    expect(() =>
      verifyPosition(p, d, d.latitude, d.longitude, d.measuredAt),
    ).not.toThrow()
    expect(() =>
      verifyPosition(
        { ...p, maxDistanceMetres: 4.999999 },
        d,
        d.latitude,
        d.longitude,
        d.measuredAt,
      ),
    ).toThrow()
    const dist = distanceMetres(
      d.latitude,
      d.longitude,
      d.latitude + 0.001,
      d.longitude,
    )!
    expect(() =>
      verifyPosition(
        { ...p, maxDistanceMetres: dist },
        { ...d, accuracyMetres: 0 },
        d.latitude + 0.001,
        d.longitude,
        d.measuredAt,
      ),
    ).not.toThrow()
    expect(() =>
      verifyPosition(
        { ...p, maxDistanceMetres: dist },
        { ...d, accuracyMetres: 0.001 },
        d.latitude + 0.001,
        d.longitude,
        d.measuredAt,
      ),
    ).toThrow()
  })
  it.each([
    ["POOR_ACCURACY", { accuracyMetres: 31 }],
    ["STALE_MEASUREMENT", { measuredAt: 1799999939999 }],
    ["FUTURE_MEASUREMENT", { measuredAt: 1800000000001 }],
  ])("rejects %s", (code, patch) => {
    try {
      verifyPosition(
        policy(),
        { ...value(), ...patch as object },
        -36.85,
        174.76,
        1800000000000,
      )
      expect.fail("Must reject")
    } catch (e) {
      expect(e).toMatchObject({ code })
    }
  })
  it.each([
    { latitude: NaN },
    { longitude: Infinity },
    { accuracyMetres: -1 },
    { accuracyMetres: "5" },
    { measuredAt: "1800000000000" },
    { measuredAt: NaN },
    { measuredAt: 0 },
    { measuredAt: 9e15 },
    { houseId: "forged" },
    { employeeId: "forged" },
    { maxDistanceMetres: 9999999 },
  ])("rejects malformed or forged request %j", (patch) =>
    expect(() => clockInInput({ ...value(), ...patch })).toThrow(),
  )
  it("handles elapsed UTC eligibility across overnight/year and both NZ DST transitions", () => {
    for (const [start, end] of [
      ["2026-12-31T09:00:00Z", "2026-12-31T17:00:00Z"],
      ["2027-09-25T13:00:00Z", "2027-09-25T15:00:00Z"],
      ["2027-04-03T12:00:00Z", "2027-04-03T16:00:00Z"],
    ]) {
      const a = new Date(start),
        b = new Date(end),
        p = policy()
      expect(eligible(p, a, b, a.getTime() - p.earlyWindowMs)).toBe(true)
      expect(eligible(p, a, b, a.getTime() - p.earlyWindowMs - 1)).toBe(false)
      expect(eligible(p, a, b, a.getTime() + p.lateWindowMs)).toBe(true)
      expect(eligible(p, a, b, a.getTime() + p.lateWindowMs + 1)).toBe(false)
      expect(
        eligible({ ...p, lateWindowMs: 999999999 }, a, b, b.getTime()),
      ).toBe(false)
    }
  })
})
describe("event-only browser capture", () => {
  it("requests one fresh high-accuracy position with bounded timeout and copies no extra metadata", async () => {
    vi.stubGlobal("isSecureContext", true)
    const once = vi.fn((success: PositionCallback) =>
      success({
        coords: { latitude: 1, longitude: 2, accuracy: 3, altitude: 400 },
        timestamp: 1800000000000,
      } as GeolocationPosition),
    )
    const watch = vi.fn()
    vi.stubGlobal("navigator", {
      geolocation: { getCurrentPosition: once, watchPosition: watch },
    })
    expect(await capturePosition()).toEqual({
      latitude: 1,
      longitude: 2,
      accuracyMetres: 3,
      measuredAt: 1800000000000,
    })
    expect(once).toHaveBeenCalledOnce()
    expect(once).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      { enableHighAccuracy: true, maximumAge: 0, timeout: expect.any(Number) },
    )
    expect(once.mock.calls[0]?.length).toBe(3)
    expect(watch).not.toHaveBeenCalled()
  })
  it.each([1, 2, 3])(
    "maps permission/unavailable/timeout code %s",
    async (code) => {
      vi.stubGlobal("isSecureContext", true)
      vi.stubGlobal("navigator", {
        geolocation: {
          getCurrentPosition: (_s: unknown, failure: PositionErrorCallback) =>
            failure({ code } as GeolocationPositionError),
        },
      })
      await expect(capturePosition()).rejects.toMatchObject({
        code:
          code === 1
            ? "PERMISSION_DENIED"
            : code === 2
              ? "POSITION_UNAVAILABLE"
              : "POSITION_TIMEOUT",
      })
    },
  )
  it("fails on insecure/unsupported origins without requesting permission", async () => {
    vi.stubGlobal("isSecureContext", false)
    await expect(capturePosition()).rejects.toMatchObject({
      code: "INSECURE_ORIGIN",
    })
    vi.stubGlobal("isSecureContext", true)
    vi.stubGlobal("navigator", {})
    await expect(capturePosition()).rejects.toMatchObject({
      code: "UNSUPPORTED_BROWSER",
    })
  })
})
