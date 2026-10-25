import {
  beforeAll,
  beforeEach,
  afterEach,
  afterAll,
  describe,
  it,
  expect,
  vi,
} from "vitest"
import { randomUUID } from "node:crypto"
import fixture from "../fixtures/gps-policy.json"
interface SessionEmployee {
  id: string
  sessionVersion: number
}
interface Session {
  user: SessionEmployee
}
const identity = vi.hoisted(() => ({ value: null as Session | null }))
vi.mock("../../src/server/auth/index", () => ({
  auth: async () => identity.value,
}))
import { database } from "../../src/server/db"
import { clockIn, getClockInState } from "../../src/server/attendance/clock-in"
import { POST, GET } from "../../src/app/api/attendance/clock-in/route"
import { cancelShift } from "../../src/server/scheduling/shifts"
import { getStaffSchedule } from "../../src/server/scheduling/shifts"
const db = database()
let org: string, house: string, employee: string, shift: string
const savedEnv = { ...process.env }
const position = () => ({
  shiftId: shift,
  requestId: randomUUID(),
  latitude: -36.85,
  longitude: 174.76,
  accuracyMetres: 5,
  measuredAt: Date.now() - 100,
})
function configure(patch: Record<string, unknown> = {}) {
  process.env.CAREMETRICS_GPS_TEST_POLICY_ACK = "fictional-development-only"
  process.env.CAREMETRICS_GPS_POLICIES = JSON.stringify([
    {
      ...fixture,
      organisationId: org,
      houses: [{ id: house, latitude: -36.85, longitude: 174.76 }],
      ...patch,
    },
  ])
}
beforeAll(async () => {
  if (process.env.NEON_BRANCH_NAME !== "local-test")
    throw new Error(
      "GPS destructive service tests require the disposable local-test database",
    )
  org = (
    await db.organisation.create({
      data: { name: `Fictional GPS ${randomUUID()}` },
    })
  ).id
  house = (
    await db.house.create({
      data: {
        organisationId: org,
        code: "GPS",
        name: "Fictional GPS house",
        address: "Fictional address",
        latitude: -36.85,
        longitude: 174.76,
      },
    })
  ).id
})
beforeEach(async () => {
  const n = randomUUID()
  employee = (
    await db.user.create({
      data: {
        organisationId: org,
        name: "Fictional GPS worker",
        employeeCode: n,
        email: `gps-${n}@example.test`,
        status: "ACTIVE",
        role: "STAFF",
      },
    })
  ).id
  await db.employeeHouseAssignment.create({
    data: { organisationId: org, employeeId: employee, houseId: house },
  })
  shift = (
    await db.shift.create({
      data: {
        organisationId: org,
        employeeId: employee,
        houseId: house,
        startsAt: new Date(Date.now() - 300000),
        endsAt: new Date(Date.now() + 28800000),
      },
    })
  ).id
  identity.value = { user: { id: employee, sessionVersion: 1 } }
  configure()
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  for (const k of [
    "CAREMETRICS_GPS_POLICIES",
    "CAREMETRICS_GPS_TEST_POLICY_ACK",
    "NODE_ENV",
    "VERCEL_ENV",
  ]) {
    if (savedEnv[k] === undefined) delete process.env[k]
    else process.env[k] = savedEnv[k]
  }
})
afterAll(async () => {
  identity.value = null
  await db.$disconnect()
})
async function noWrite() {
  expect(await db.attendanceRecord.count({ where: { shiftId: shift } })).toBe(0)
  expect(
    await db.auditEvent.count({
      where: { actorId: employee, action: "attendance.clocked_in" },
    }),
  ).toBe(0)
}
describe("GPS clock-in PostgreSQL security", () => {
  it("commits trusted receipt time, minimal evidence and audit; own state survives independent reads", async () => {
    const body = position(),
      before = Date.now(),
      result = await clockIn(body)
    expect(result.replayed).toBe(false)
    const event = await db.attendanceRecord.findUniqueOrThrow({
      where: { shiftId: shift },
    })
    expect(event).toMatchObject({
      organisationId: org,
      employeeId: employee,
      houseId: house,
      verification: "SERVER_VALIDATED_LOCATION_TEST",
      policyVersion: fixture.version,
      accuracyMetres: 5,
      clockOut: null,
    })
    expect(event.clockIn!.getTime()).toBeGreaterThanOrEqual(before)
    expect(event.clockIn!.getTime()).toBeLessThanOrEqual(Date.now())
    expect(event.measuredAt!.getTime()).toBe(body.measuredAt)
    expect(event.clockIn!.getTime()).toBeGreaterThan(body.measuredAt)
    expect(Object.keys(event)).not.toContain("latitude")
    expect(Object.keys(event)).not.toContain("longitude")
    expect(event.requestDigest).toMatch(/^[a-f0-9]{64}$/)
    const audit = await db.auditEvent.findFirstOrThrow({
      where: { targetId: event.id },
    })
    expect(audit).toMatchObject({
      actorId: employee,
      organisationId: org,
      action: "attendance.clocked_in",
      targetType: "attendance",
    })
    expect(JSON.stringify(audit.summary)).not.toMatch(
      /latitude|longitude|accuracy|measuredAt|requestDigest/,
    )
    expect((await getClockInState(shift)).attendance?.id).toBe(event.id)
    expect(
      (await getStaffSchedule({ shiftId: shift })).detail?.clockIn?.attendance
        ?.id,
    ).toBe(event.id)
  })
  it.each([
    ["OUTSIDE_BOUNDARY", { latitude: -36.9 }],
    ["OUTSIDE_BOUNDARY", { latitude: -36.8456, accuracyMetres: 30 }],
    ["POOR_ACCURACY", { accuracyMetres: 31 }],
    ["STALE_MEASUREMENT", { measuredAt: 1 }],
    ["FUTURE_MEASUREMENT", { measuredAt: Date.now() + 86400000 }],
    ["INVALID_LOCATION", { latitude: NaN }],
    ["INVALID_LOCATION", { longitude: Infinity }],
    ["INVALID_LOCATION", { latitude: 91 }],
    ["INVALID_LOCATION", { longitude: -181 }],
    ["INVALID_LOCATION", { accuracyMetres: -1 }],
    ["INVALID_LOCATION", { accuracyMetres: "5" }],
    ["INVALID_LOCATION", { measuredAt: NaN }],
    ["INVALID_LOCATION", { measuredAt: "now" }],
    ["INVALID_INPUT", { employeeId: "forged" }],
    ["INVALID_INPUT", { organisationId: "forged" }],
    ["INVALID_INPUT", { houseId: "forged" }],
    ["INVALID_INPUT", { radiusMetres: 999999 }],
  ])("rejects %s without attendance or success audit", async (code, patch) => {
    await expect(
      clockIn({ ...position(), ...patch as object }),
    ).rejects.toMatchObject({ code })
    await noWrite()
  })
  it.each(["missing", "disabled", "invalid", "unapproved", "production"])(
    "rejects %s policy",
    async (kind) => {
      if (kind === "missing") delete process.env.CAREMETRICS_GPS_POLICIES
      if (kind === "disabled") configure({ enabled: false })
      if (kind === "invalid") configure({ maxDistanceMetres: -1 })
      if (kind === "unapproved") configure({ approval: "pending" })
      if (kind === "production") process.env.VERCEL_ENV = "production"
      await expect(clockIn(position())).rejects.toMatchObject({
        code: "POLICY_UNAVAILABLE",
        status: 503,
      })
      await noWrite()
    },
  )
  it.each(["null", "changed"])(
    "blocks %s house coordinates instead of inferring from address",
    async (kind) => {
      const original = await db.house.findUniqueOrThrow({
        where: { id: house },
      })
      await db.house.update({
        where: { id: house },
        data: {
          latitude: kind === "null" ? null : -36.86,
          longitude: kind === "null" ? null : 174.76,
        },
      })
      try {
        await expect(clockIn(position())).rejects.toMatchObject({
          code: "HOUSE_UNCONFIGURED",
        })
        await noWrite()
      } finally {
        await db.house.update({
          where: { id: house },
          data: { latitude: original.latitude, longitude: original.longitude },
        })
      }
    },
  )
  it("rejects anonymous, revoked and inactive accounts", async () => {
    identity.value = null
    await expect(clockIn(position())).rejects.toMatchObject({ status: 401 })
    identity.value = { user: { id: employee, sessionVersion: 1 } }
    await db.user.update({
      where: { id: employee },
      data: { status: "INACTIVE" },
    })
    await expect(clockIn(position())).rejects.toMatchObject({ status: 401 })
    await db.user.update({
      where: { id: employee },
      data: { status: "ACTIVE" },
    })
    await expect(clockIn(position())).rejects.toMatchObject({ status: 401 })
    await noWrite()
  })
  it("denies coworker and cross-tenant shifts without revealing their attendance", async () => {
    const body = position(),
      owner = employee
    const stranger = await db.user.create({
      data: {
        organisationId: org,
        name: "Fictional stranger",
        email: `stranger-${randomUUID()}@example.test`,
        employeeCode: randomUUID(),
        status: "ACTIVE",
        role: "STAFF",
      },
    })
    identity.value = { user: { id: stranger.id, sessionVersion: 1 } }
    await expect(clockIn(body)).rejects.toMatchObject({ status: 404 })
    await expect(getClockInState(shift)).rejects.toMatchObject({ status: 404 })
    const second = await db.organisation.create({
      data: { name: "Fictional other GPS tenant" },
    })
    const other = await db.user.create({
      data: {
        organisationId: second.id,
        name: "Fictional other tenant",
        email: `tenant-${randomUUID()}@example.test`,
        employeeCode: randomUUID(),
        status: "ACTIVE",
        role: "STAFF",
      },
    })
    identity.value = { user: { id: other.id, sessionVersion: 1 } }
    await expect(clockIn(body)).rejects.toMatchObject({ status: 404 })
    employee = owner
    await noWrite()
  })
  it.each(["cancelled", "assignment", "house"])(
    "rechecks %s state",
    async (kind) => {
      if (kind === "cancelled")
        await db.shift.update({
          where: { id: shift },
          data: { status: "CANCELLED" },
        })
      if (kind === "assignment")
        await db.employeeHouseAssignment.update({
          where: {
            organisationId_employeeId_houseId: {
              organisationId: org,
              employeeId: employee,
              houseId: house,
            },
          },
          data: { active: false },
        })
      if (kind === "house")
        await db.house.update({ where: { id: house }, data: { active: false } })
      try {
        await expect(clockIn(position())).rejects.toMatchObject({
          status: kind === "cancelled" ? 409 : 404,
        })
        await noWrite()
      } finally {
        if (kind === "house")
          await db.house.update({
            where: { id: house },
            data: { active: true },
          })
      }
    },
  )
  it.each(["early", "late", "ended"])(
    "rejects %s eligibility",
    async (kind) => {
      const now = Date.now()
      await db.shift.update({
        where: { id: shift },
        data: {
          startsAt: new Date(now + (kind === "early" ? 660000 : -3660000)),
          endsAt: new Date(now + (kind === "ended" ? -1 : 28800000)),
        },
      })
      await expect(clockIn(position())).rejects.toMatchObject({
        code: "INELIGIBLE_SHIFT",
      })
      await noWrite()
    },
  )
  it.each([
    ["2026-12-31T09:00:00Z", "2026-12-31T17:00:00Z"],
    ["2027-09-25T13:00:00Z", "2027-09-25T15:00:00Z"],
    ["2027-04-03T12:00:00Z", "2027-04-03T16:00:00Z"],
  ])("validates overnight/year/DST instant %s", async (start, end) => {
    await db.shift.update({
      where: { id: shift },
      data: { startsAt: new Date(start), endsAt: new Date(end) },
    })
    vi.spyOn(Date, "now").mockReturnValue(Date.parse(start) + 60000)
    expect((await clockIn(position())).attendance?.clockIn).toBe(
      new Date(Date.now()).toISOString(),
    )
  })
  it("keeps an open recorded clock-in visible after the scheduled shift ends", async () => {
    const event = (await clockIn(position())).attendance!
    const future = Date.now() + 9 * 3600000
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(future)
    const data = await getStaffSchedule()
    expect(data.upcoming).toHaveLength(0)
    expect(data.activeAttendanceShift?.id).toBe(shift)
    expect(data.activeAttendanceShift?.clockIn?.attendance?.id).toBe(event.id)
    expect(data.activeAttendanceShift?.clockIn?.attendance?.clockIn).toBe(
      event.clockIn,
    )
    expect(
      (
        await db.attendanceRecord.findUniqueOrThrow({
          where: { shiftId: shift },
        })
      ).clockOut,
    ).toBeNull()
  })
  it("serialises identical concurrent retries to one event and audit", async () => {
    const d = position(),
      rows = await Promise.all([clockIn(d), clockIn(d)])
    expect(rows[0].attendance!.id).toBe(rows[1].attendance!.id)
    expect(rows.map((r) => r.replayed).sort()).toEqual([false, true])
    expect(await db.attendanceRecord.count({ where: { shiftId: shift } })).toBe(
      1,
    )
    expect(
      await db.auditEvent.count({
        where: { actorId: employee, action: "attendance.clocked_in" },
      }),
    ).toBe(1)
  })
  it("rejects simultaneous different requests and an incompatible open second shift; DB constraint backs it", async () => {
    const outcomes = await Promise.allSettled([
      clockIn(position()),
      clockIn(position()),
    ])
    expect(outcomes.filter((r) => r.status === "fulfilled")).toHaveLength(1)
    expect(outcomes.filter((r) => r.status === "rejected")).toHaveLength(1)
    const second = await db.shift.create({
      data: {
        organisationId: org,
        employeeId: employee,
        houseId: house,
        startsAt: new Date(Date.now() - 300000),
        endsAt: new Date(Date.now() + 3600000),
      },
    })
    await expect(
      clockIn({ ...position(), shiftId: second.id }),
    ).rejects.toMatchObject({ code: "ACTIVE_ATTENDANCE" })
    await expect(
      db.attendanceRecord.create({
        data: {
          organisationId: org,
          employeeId: employee,
          shiftId: second.id,
          clockIn: new Date(),
        },
      }),
    ).rejects.toMatchObject({ code: "P2002" })
  })
  it("returns exact committed retry after measurement/window expiry; changed payload cannot replay", async () => {
    const d = position(),
      result = await clockIn(d)
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 7200000)
    const retry = await clockIn(d)
    expect(retry).toEqual({ ...result, replayed: true })
    await expect(clockIn({ ...d, accuracyMetres: 6 })).rejects.toMatchObject({
      status: 409,
    })
    await expect(
      clockIn({ ...d, requestId: randomUUID() }),
    ).rejects.toMatchObject({ status: 409 })
    expect(
      await db.auditEvent.count({
        where: { actorId: employee, action: "attendance.clocked_in" },
      }),
    ).toBe(1)
  })
  it("retains immutable evidence and cannot cancel its shift", async () => {
    const row = (await clockIn(position())).attendance!
    await expect(
      db.attendanceRecord.update({
        where: { id: row.id },
        data: { accuracyMetres: 1 },
      }),
    ).rejects.toThrow()
    await expect(
      db.attendanceRecord.delete({ where: { id: row.id } }),
    ).rejects.toThrow()
    expect((await getClockInState(shift)).attendance?.id).toBe(row.id)
    const manager = await db.user.update({
      where: { id: employee },
      data: { role: "MANAGER" },
    })
    identity.value = {
      user: { id: employee, sessionVersion: manager.sessionVersion },
    }
    const schedule = await db.shift.findUniqueOrThrow({ where: { id: shift } })
    await expect(
      cancelShift(shift, {
        confirmed: true,
        expectedUpdatedAt: schedule.updatedAt.toISOString(),
      }),
    ).rejects.toMatchObject({ status: 409 })
  })
  it("rolls back attendance when audit fails", async () => {
    await db.$executeRawUnsafe(
      `CREATE FUNCTION cm2e_fail_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."actorId"='${employee}'::uuid AND NEW.action='attendance.clocked_in' THEN RAISE EXCEPTION 'test audit rollback'; END IF; RETURN NEW; END; $$`,
    )
    await db.$executeRawUnsafe(
      'CREATE TRIGGER cm2e_fail_audit BEFORE INSERT ON "AuditEvent" FOR EACH ROW EXECUTE FUNCTION cm2e_fail_audit()',
    )
    try {
      await expect(clockIn(position())).rejects.toThrow()
      await noWrite()
    } finally {
      await db.$executeRawUnsafe('DROP TRIGGER cm2e_fail_audit ON "AuditEvent"')
      await db.$executeRawUnsafe("DROP FUNCTION cm2e_fail_audit()")
    }
  })
  it("HTTP checks origin/body; DB failure is generic with no fallback or leaked position", async () => {
    const d = position(),
      origin = process.env.AUTH_URL!
    expect(
      (
        await POST(
          new Request(origin + "/api/attendance/clock-in", {
            method: "POST",
            headers: {
              Origin: "https://wrong.example.test",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(d),
          }),
        )
      ).status,
    ).toBe(403)
    expect(
      (
        await POST(
          new Request(origin + "/api/attendance/clock-in", {
            method: "POST",
            headers: { Origin: origin, "Content-Type": "application/json" },
            body: "{",
          }),
        )
      ).status,
    ).toBe(400)
    const failure = vi
      .spyOn(db, "$transaction")
      .mockRejectedValueOnce(new Error("private database details"))
    const response = await POST(
      new Request(origin + "/api/attendance/clock-in", {
        method: "POST",
        headers: { Origin: origin, "Content-Type": "application/json" },
        body: JSON.stringify(d),
      }),
    )
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ error: "Service unavailable" })
    failure.mockRestore()
    const readFailure = vi
      .spyOn(db.shift, "findFirst")
      .mockRejectedValueOnce(new Error("private read details"))
    expect(
      (
        await GET(
          new Request(origin + `/api/attendance/clock-in?shiftId=${shift}`),
        )
      ).status,
    ).toBe(503)
    readFailure.mockRestore()
    await noWrite()
  })
})
