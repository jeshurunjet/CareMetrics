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
import gpsFixture from "../fixtures/gps-policy.json"
import outFixture from "../fixtures/clock-out-policy.json"
interface EmployeeSession {
  id: string
  sessionVersion: number
}
interface Session {
  user: EmployeeSession
}
const identity = vi.hoisted(() => ({ value: null as Session | null }))
vi.mock("../../src/server/auth/index", () => ({
  auth: async () => identity.value,
}))
import { database } from "../../src/server/db"
import { clockIn } from "../../src/server/attendance/clock-in"
import { clockOut } from "../../src/server/attendance/clock-out"
import {
  getStaffAttendanceHistory,
  getAdminAttendanceHistory,
  getOwnAttendanceOverview,
} from "../../src/server/attendance/history"
import { requireHouse } from "../../src/server/data/access"
import { POST } from "../../src/app/api/attendance/clock-out/route"
import { GET } from "../../src/app/api/attendance/route"
const db = database(),
  savedEnv = { ...process.env }
let org: string,
  house: string,
  employee: string,
  shift: string,
  attendance: string
async function as(id: string) {
  const u = await db.user.findUniqueOrThrow({ where: { id } })
  identity.value = { user: { id, sessionVersion: u.sessionVersion } }
}
function configure(patch: Record<string, unknown> = {}) {
  process.env.CAREMETRICS_GPS_TEST_POLICY_ACK = "fictional-development-only"
  process.env.CAREMETRICS_GPS_POLICIES = JSON.stringify([
    {
      ...gpsFixture,
      organisationId: org,
      houses: [{ id: house, latitude: -36.85, longitude: 174.76 }],
    },
  ])
  process.env.CAREMETRICS_CLOCK_OUT_TEST_POLICY_ACK =
    "fictional-development-only"
  process.env.CAREMETRICS_CLOCK_OUT_POLICIES = JSON.stringify([
    { ...outFixture, organisationId: org, ...patch },
  ])
}
async function worker(
  role: "STAFF" | "MANAGER" = "STAFF",
  organisationId = org,
) {
  return db.user.create({
    data: {
      organisationId,
      name: "Fictional Clock-out Worker",
      employeeCode: randomUUID(),
      email: `out-${randomUUID()}@example.test`,
      role,
      status: "ACTIVE",
    },
  })
}
async function newShift(
  employeeId = employee,
  start = new Date(Date.now() - 300000),
  end = new Date(Date.now() + 28800000),
) {
  return db.shift.create({
    data: {
      organisationId: org,
      employeeId,
      houseId: house,
      startsAt: start,
      endsAt: end,
    },
  })
}
async function enter(shiftId = shift) {
  return (
    await clockIn({
      shiftId,
      requestId: randomUUID(),
      latitude: -36.85,
      longitude: 174.76,
      accuracyMetres: 5,
      measuredAt: Date.now() - 100,
    })
  ).attendance!
}
const input = () => ({ attendanceId: attendance, requestId: randomUUID() })
beforeAll(async () => {
  if (process.env.NEON_BRANCH_NAME !== "local-test")
    throw new Error("Clock-out destructive tests require disposable local-test")
  org = (
    await db.organisation.create({
      data: { name: `Fictional Clock-out ${randomUUID()}` },
    })
  ).id
  house = (
    await db.house.create({
      data: {
        organisationId: org,
        code: "OUT",
        name: "Fictional Clock-out House",
        address: "Fictional address",
        latitude: -36.85,
        longitude: 174.76,
      },
    })
  ).id
})
beforeEach(async () => {
  configure()
  employee = (await worker()).id
  await db.employeeHouseAssignment.create({
    data: { organisationId: org, employeeId: employee, houseId: house },
  })
  shift = (await newShift()).id
  await as(employee)
  attendance = (await enter()).id
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  for (const k of [
    "CAREMETRICS_GPS_TEST_POLICY_ACK",
    "CAREMETRICS_GPS_POLICIES",
    "CAREMETRICS_CLOCK_OUT_TEST_POLICY_ACK",
    "CAREMETRICS_CLOCK_OUT_POLICIES",
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
async function unchanged() {
  expect(
    (await db.attendanceRecord.findUniqueOrThrow({ where: { id: attendance } }))
      .clockOut,
  ).toBeNull()
  expect(
    await db.auditEvent.count({
      where: { targetId: attendance, action: "attendance.clocked_out" },
    }),
  ).toBe(0)
}
describe("persistent clock-out and historical own-record access", () => {
  it("closes in place using receipt time, preserves every clock-in field and appends one audit", async () => {
    const before = await db.attendanceRecord.findUniqueOrThrow({
        where: { id: attendance },
      }),
      oldAudit = await db.auditEvent.findFirstOrThrow({
        where: { targetId: attendance, action: "attendance.clocked_in" },
      }),
      now = Date.now()
    const result = await clockOut(input()),
      after = await db.attendanceRecord.findUniqueOrThrow({
        where: { id: attendance },
      })
    expect(result.attendance!.id).toBe(attendance)
    expect(result.replayed).toBe(false)
    expect(after.clockOut!.getTime()).toBeGreaterThanOrEqual(now)
    expect(after.clockOut!.getTime()).toBeLessThanOrEqual(Date.now())
    expect(after.clockOutVerification).toBe("NO_LOCATION_REQUIRED_TEST")
    expect(after.clockOutPolicyVersion).toBe(outFixture.version)
    const changed = new Set([
      "clockOut",
      "clockOutRequestId",
      "clockOutRequestDigest",
      "clockOutPolicyVersion",
      "clockOutPolicySnapshot",
      "clockOutVerification",
      "updatedAt",
    ])
    for (const key of Object.keys(before) as Array<keyof typeof before>)
      if (!changed.has(key)) expect(after[key]).toEqual(before[key])
    expect(
      await db.auditEvent.findUniqueOrThrow({ where: { id: oldAudit.id } }),
    ).toEqual(oldAudit)
    const audit = await db.auditEvent.findFirstOrThrow({
      where: { targetId: attendance, action: "attendance.clocked_out" },
    })
    expect(audit.actorId).toBe(employee)
    expect(audit.organisationId).toBe(org)
    expect(JSON.stringify(audit.summary)).not.toMatch(
      /latitude|longitude|accuracy|measuredAt/,
    )
  })
  it("rejects absent/incomplete attendance instead of creating an independent record", async () => {
    await expect(
      clockOut({ ...input(), attendanceId: randomUUID() }),
    ).rejects.toMatchObject({ status: 404 })
    const s = await newShift(
        employee,
        new Date(Date.now() + 86400000),
        new Date(Date.now() + 90000000),
      ),
      blank = await db.attendanceRecord.create({
        data: { organisationId: org, employeeId: employee, shiftId: s.id },
      })
    await expect(
      clockOut({ ...input(), attendanceId: blank.id }),
    ).rejects.toMatchObject({ code: "NO_OPEN_ATTENDANCE" })
    await unchanged()
  })
  it.each([
    "missing",
    "disabled",
    "unapproved",
    "unconfigured",
    "location",
    "production",
  ])("fails closed for %s clock-out policy", async (kind) => {
    if (kind === "missing") delete process.env.CAREMETRICS_CLOCK_OUT_POLICIES
    if (kind === "disabled") configure({ enabled: false })
    if (kind === "unapproved") configure({ approval: "approved" })
    if (kind === "unconfigured") configure({ mode: "UNCONFIGURED" })
    if (kind === "location") configure({ mode: "LOCATION_REQUIRED" })
    if (kind === "production") process.env.VERCEL_ENV = "production"
    await expect(clockOut(input())).rejects.toMatchObject({
      status: 503,
      code:
        kind === "location"
          ? "CLOCK_OUT_LOCATION_REQUIRED"
          : "CLOCK_OUT_POLICY_UNAVAILABLE",
    })
    await unchanged()
  })
  it.each([
    { clockOut: "2099-01-01T00:00:00Z" },
    { employeeId: "forged" },
    { organisationId: "forged" },
    { role: "ADMINISTRATOR" },
    { latitude: -36.85 },
    { longitude: 174.76 },
    { measuredAt: Date.now() },
  ])(
    "rejects unsupported browser authority or unnecessary location %j",
    async (patch) => {
      await expect(clockOut({ ...input(), ...patch })).rejects.toMatchObject({
        status: 400,
      })
      await unchanged()
    },
  )
  it("rejects unrelated employees and cross-organisation records", async () => {
    await as((await worker()).id)
    await expect(clockOut(input())).rejects.toMatchObject({ status: 404 })
    const otherOrg = await db.organisation.create({
      data: { name: "Fictional other clock-out organisation" },
    })
    await as((await worker("STAFF", otherOrg.id)).id)
    await expect(clockOut(input())).rejects.toMatchObject({ status: 404 })
    await expect(
      getStaffAttendanceHistory({ attendanceId: attendance }),
    ).rejects.toMatchObject({ status: 404 })
    await unchanged()
  })
  it("rejects revoked/deactivated sessions without abandoning the stored open record", async () => {
    await db.user.update({
      where: { id: employee },
      data: { status: "INACTIVE" },
    })
    await expect(clockOut(input())).rejects.toMatchObject({ status: 401 })
    await db.user.update({
      where: { id: employee },
      data: { status: "ACTIVE" },
    })
    await expect(clockOut(input())).rejects.toMatchObject({ status: 401 })
    await unchanged()
  })
  it("allows minimal own closure after assignment removal/house deactivation/cancellation without house access", async () => {
    await db.employeeHouseAssignment.updateMany({
      where: { employeeId: employee, houseId: house },
      data: { active: false },
    })
    await db.house.update({ where: { id: house }, data: { active: false } })
    await db.shift.update({
      where: { id: shift },
      data: { status: "CANCELLED" },
    })
    try {
      await expect(requireHouse(house)).rejects.toMatchObject({ status: 404 })
      expect((await getOwnAttendanceOverview())?.id).toBe(attendance)
      expect((await getStaffAttendanceHistory()).rows[0].id).toBe(attendance)
      expect((await clockOut(input())).attendance?.clockOut).not.toBeNull()
      await expect(requireHouse(house)).rejects.toMatchObject({ status: 404 })
      await expect(enter()).rejects.toThrow()
    } finally {
      await db.house.update({ where: { id: house }, data: { active: true } })
    }
  })
  it("closes a legacy modified schedule without rewriting the recorded house or granting new house access", async () => {
    const destination = await db.house.create({
      data: {
        organisationId: org,
        code: randomUUID(),
        name: "Fictional changed schedule house",
        address: "Fictional address",
      },
    })
    await db.shift.update({
      where: { id: shift },
      data: {
        houseId: destination.id,
        startsAt: new Date(Date.now() + 86400000),
        endsAt: new Date(Date.now() + 90000000),
      },
    })
    const original = await db.attendanceRecord.findUniqueOrThrow({
      where: { id: attendance },
    })
    await expect(requireHouse(destination.id)).rejects.toMatchObject({
      status: 404,
    })
    expect(
      (await getStaffAttendanceHistory({ attendanceId: attendance })).detail
        ?.houseId,
    ).toBe(house)
    expect(
      (await getStaffAttendanceHistory()).houses.map((h) => h.id),
    ).not.toContain(destination.id)
    await clockOut(input())
    const after = await db.attendanceRecord.findUniqueOrThrow({
      where: { id: attendance },
    })
    expect(after.houseId).toBe(house)
    expect(after.clockIn).toEqual(original.clockIn)
    expect(after.policySnapshot).toEqual(original.policySnapshot)
    expect(after.clockOut).not.toBeNull()
  })
  it("releases the single-open slot for a later eligible shift without reopening the old record", async () => {
    const later = Date.now() + 9 * 3600000
    vi.spyOn(Date, "now").mockReturnValue(later)
    await clockOut(input())
    const next = await newShift(
      employee,
      new Date(later - 300000),
      new Date(later + 28800000),
    )
    const event = await enter(next.id)
    expect(event.id).not.toBe(attendance)
    expect(event.clockOut).toBeNull()
    expect(
      (
        await db.attendanceRecord.findUniqueOrThrow({
          where: { id: attendance },
        })
      ).clockOut,
    ).not.toBeNull()
    expect(
      await db.attendanceRecord.count({
        where: {
          organisationId: org,
          employeeId: employee,
          clockIn: { not: null },
          clockOut: null,
        },
      }),
    ).toBe(1)
  })
  it.each([
    ["2026-12-31T09:00:00Z", "2026-12-31T17:30:00Z", 8.5],
    ["2027-09-25T13:00:00Z", "2027-09-25T15:00:00Z", 2],
    ["2027-04-03T12:00:00Z", "2027-04-03T16:00:00Z", 4],
  ])(
    "closes overnight/year/DST %s using actual instants even after scheduled end",
    async (start, end, hours) => {
      const u = await worker()
      await db.employeeHouseAssignment.create({
        data: { organisationId: org, employeeId: u.id, houseId: house },
      })
      const s = await newShift(
        u.id,
        new Date(start),
        new Date(Date.parse(start) + 3600000),
      )
      await as(u.id)
      const clock = vi.spyOn(Date, "now").mockReturnValue(Date.parse(start))
      const event = await enter(s.id)
      clock.mockReturnValue(Date.parse(end))
      const result = await clockOut({
        attendanceId: event.id,
        requestId: randomUUID(),
      })
      expect(result.attendance?.clockOut).toBe(new Date(end).toISOString())
      expect(result.attendance?.elapsedMilliseconds).toBe(hours * 3600000)
    },
  )
  it("rejects a nonpositive server interval instead of inventing elapsed time", async () => {
    const row = await db.attendanceRecord.findUniqueOrThrow({
      where: { id: attendance },
    })
    vi.spyOn(Date, "now").mockReturnValue(row.clockIn!.getTime())
    await expect(clockOut(input())).rejects.toMatchObject({
      code: "CLOCK_OUT_TIME_CONFLICT",
    })
    await unchanged()
  })
  it("serialises identical concurrent retries to one timestamp and completion audit", async () => {
    const d = input(),
      results = await Promise.all([clockOut(d), clockOut(d)])
    expect(results[0].attendance).toEqual(results[1].attendance)
    expect(results.map((r) => r.replayed).sort()).toEqual([false, true])
    expect(
      await db.auditEvent.count({
        where: { targetId: attendance, action: "attendance.clocked_out" },
      }),
    ).toBe(1)
  })
  it("conflicts simultaneous different requests and cannot reopen or alter a completed timestamp", async () => {
    const results = await Promise.allSettled([
      clockOut(input()),
      clockOut(input()),
    ])
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1)
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(1)
    const row = await db.attendanceRecord.findUniqueOrThrow({
      where: { id: attendance },
    })
    await expect(clockOut(input())).rejects.toMatchObject({ status: 409 })
    await expect(
      db.attendanceRecord.update({
        where: { id: attendance },
        data: { clockOut: null },
      }),
    ).rejects.toThrow()
    await expect(
      db.attendanceRecord.update({
        where: { id: attendance },
        data: { clockOut: new Date(row.clockOut!.getTime() + 1) },
      }),
    ).rejects.toThrow()
    await expect(
      db.attendanceRecord.update({
        where: { id: attendance },
        data: { clockIn: new Date(row.clockIn!.getTime() - 1) },
      }),
    ).rejects.toThrow()
    expect(
      (
        await db.attendanceRecord.findUniqueOrThrow({
          where: { id: attendance },
        })
      ).clockOut,
    ).toEqual(row.clockOut)
  })
  it("exact lost-response retry reads the original completion even if current policy is removed", async () => {
    const d = input(),
      saved = await clockOut(d)
    delete process.env.CAREMETRICS_CLOCK_OUT_POLICIES
    expect(await clockOut(d)).toEqual({ ...saved, replayed: true })
    expect(
      (await getStaffAttendanceHistory({ attendanceId: attendance })).detail
        ?.clockOut,
    ).toBe(saved.attendance?.clockOut)
    await expect(
      clockOut({ ...d, requestId: randomUUID() }),
    ).rejects.toMatchObject({ status: 409 })
  })
  it("scopes history, enforces management capability and bounds/paginates records without GPS evidence", async () => {
    await clockOut(input())
    for (let i = 1; i <= 7; i++) {
      const start = new Date(Date.now() - i * 86400000),
        s = await newShift(employee, start, new Date(start.getTime() + 3600000))
      await db.attendanceRecord.create({
        data: {
          organisationId: org,
          employeeId: employee,
          shiftId: s.id,
          clockIn: start,
          clockOut: new Date(start.getTime() + 1800000),
        },
      })
    }
    const first = await getStaffAttendanceHistory(),
      second = await getStaffAttendanceHistory({ page: "2" })
    expect(first.rows).toHaveLength(6)
    expect(first.total).toBe(8)
    expect(second.rows).toHaveLength(2)
    expect(first.rows.every((r) => r.employeeId === employee)).toBe(true)
    expect(JSON.stringify(first)).not.toMatch(
      /latitude|longitude|accuracyMetres|measuredAt|requestDigest|policySnapshot/,
    )
    await expect(
      getStaffAttendanceHistory({ employee: randomUUID() }),
    ).rejects.toMatchObject({ status: 400 })
    await expect(getAdminAttendanceHistory()).rejects.toMatchObject({
      status: 403,
    })
    await as((await worker("MANAGER")).id)
    expect(
      (await getAdminAttendanceHistory({ attendanceId: attendance })).detail
        ?.id,
    ).toBe(attendance)
    const otherOrg = await db.organisation.create({
      data: { name: "Fictional isolated management" },
    })
    await as((await worker("MANAGER", otherOrg.id)).id)
    await expect(
      getAdminAttendanceHistory({ attendanceId: attendance }),
    ).rejects.toMatchObject({ status: 404 })
  })
  it.each([
    { page: "0" },
    { page: "100001" },
    { page: "1.1" },
    { status: "approved" },
    { from: "2026-02-30" },
    { from: "2027-01-02", to: "2027-01-01" },
    { house: "bad" },
    { attendanceId: "bad" },
    { includeGps: "true" },
  ])("rejects malformed history filters %j", async (q) => {
    await expect(getStaffAttendanceHistory(q)).rejects.toMatchObject({
      status: 400,
    })
  })
  it("rolls back completion and metadata if audit fails", async () => {
    await db.$executeRawUnsafe(
      `CREATE FUNCTION cm2f_fail_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."actorId"='${employee}'::uuid AND NEW.action='attendance.clocked_out' THEN RAISE EXCEPTION 'test completion rollback'; END IF; RETURN NEW; END; $$`,
    )
    await db.$executeRawUnsafe(
      'CREATE TRIGGER cm2f_fail_audit BEFORE INSERT ON "AuditEvent" FOR EACH ROW EXECUTE FUNCTION cm2f_fail_audit()',
    )
    try {
      await expect(clockOut(input())).rejects.toThrow()
      await unchanged()
      expect(
        (
          await db.attendanceRecord.findUniqueOrThrow({
            where: { id: attendance },
          })
        ).clockOutRequestId,
      ).toBeNull()
    } finally {
      await db.$executeRawUnsafe('DROP TRIGGER cm2f_fail_audit ON "AuditEvent"')
      await db.$executeRawUnsafe("DROP FUNCTION cm2f_fail_audit()")
    }
  })
  it("origin/failed transaction/failed history return safe errors with no fictional fallback", async () => {
    const origin = process.env.AUTH_URL!,
      request = (o = origin) =>
        new Request(origin + "/api/attendance/clock-out", {
          method: "POST",
          headers: { Origin: o, "Content-Type": "application/json" },
          body: JSON.stringify(input()),
        })
    expect((await POST(request("https://wrong.example.test"))).status).toBe(403)
    const failing = vi
      .spyOn(db, "$transaction")
      .mockRejectedValueOnce(new Error("private transaction detail"))
    const response = await POST(request())
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ error: "Service unavailable" })
    failing.mockRestore()
    await unchanged()
    const read = vi
      .spyOn(db.attendanceRecord, "findMany")
      .mockRejectedValueOnce(new Error("private history detail"))
    const result = await GET(new Request(origin + "/api/attendance"))
    expect(result.status).toBe(503)
    expect(await result.json()).toEqual({ error: "Service unavailable" })
    read.mockRestore()
  })
})
