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
import { demoEnvironment } from "../fixtures/demo-policy"
interface SessionUser {
  id: string
  sessionVersion: number
}
interface Session {
  user: SessionUser
}
const identity = vi.hoisted(() => ({ value: null as Session | null }))
vi.mock("../../src/server/auth/index", () => ({
  auth: async () => identity.value,
}))
import { database } from "../../src/server/db"
import { clockIn } from "../../src/server/attendance/clock-in"
import { clockOut } from "../../src/server/attendance/clock-out"
import { getAttendanceLocation } from "../../src/server/attendance/location"
import { limitLocationReads } from "../../src/server/attendance/location-throttle"
import { LOCATION_RETENTION_MS } from "../../src/server/attendance/demo-policy"
const db = database(),
  saved = { ...process.env }
let org: string, house: string, employee: string, shift: string
const position = () => ({
  shiftId: shift,
  requestId: randomUUID(),
  latitude: 51.5074,
  longitude: -0.1278,
  accuracyMetres: 5,
  measuredAt: Date.now() - 100,
})
beforeAll(async () => {
  if (process.env.NEON_BRANCH_NAME !== "local-test")
    throw new Error("Disposable local-test database required")
  org = (
    await db.organisation.create({
      data: { name: "GPS recording test", isFictionalDemo: true },
    })
  ).id
  house = (
    await db.house.create({
      data: {
        organisationId: org,
        code: "REC",
        name: "Recording house",
        address: "Fictional address",
      },
    })
  ).id
  await db.$executeRawUnsafe("CREATE ROLE caremetrics_location_purger NOLOGIN")
  await db.$executeRawUnsafe(
    "GRANT USAGE ON SCHEMA public TO caremetrics_location_purger",
  )
  await db.$executeRawUnsafe(
    "GRANT EXECUTE ON FUNCTION public.purge_expired_demo_locations() TO caremetrics_location_purger",
  )
  await db.$executeRawUnsafe(
    "GRANT EXECUTE ON FUNCTION public.next_demo_location_expiry() TO caremetrics_location_purger",
  )
})
beforeEach(async () => {
  Object.assign(process.env, demoEnvironment(org))
  const n = randomUUID()
  employee = (
    await db.user.create({
      data: {
        organisationId: org,
        name: "Jordan Walker",
        employeeCode: n,
        email: n + "@example.test",
        role: "STAFF",
        status: "ACTIVE",
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
})
afterEach(() => {
  vi.restoreAllMocks()
  for (const k of Object.keys(demoEnvironment(org))) {
    if (saved[k] === undefined) delete process.env[k]
    else process.env[k] = saved[k]
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
describe("Recording-only demo, real PostgreSQL", () => {
  it("requires the database fictional marker as well as server settings", async () => {
    await db.organisation.update({
      where: { id: org },
      data: { isFictionalDemo: false },
    })
    try {
      await expect(clockIn(position())).rejects.toMatchObject({
        code: "HOUSE_UNCONFIGURED",
      })
      await noWrite()
    } finally {
      await db.organisation.update({
        where: { id: org },
        data: { isFictionalDemo: true },
      })
    }
  })
  it("throttles precise-evidence reads through shared PostgreSQL counters", async () => {
    for (let n = 0; n < 60; n++) await limitLocationReads(employee)
    await expect(limitLocationReads(employee)).rejects.toMatchObject({
      status: 429,
    })
  })

  it("records far-away coordinates without house coordinates; atomic minimal audit and exact retry", async () => {
    const d = position(),
      rows = await Promise.all([clockIn(d), clockIn(d)])
    expect(rows[0].attendance!.id).toBe(rows[1].attendance!.id)
    expect(rows.map((x) => x.replayed).sort()).toEqual([false, true])
    const id = rows[0].attendance!.id
    const evidence = await db.attendanceLocationEvidence.findUniqueOrThrow({
      where: { attendanceId: id },
    })
    expect(evidence.latitude).toBe(d.latitude)
    const next = await db.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("SET LOCAL ROLE caremetrics_location_purger")
      return tx.$queryRawUnsafe<Array<{ expiresAt: Date | null }>>(
        'SELECT public.next_demo_location_expiry() AS "expiresAt"',
      )
    })
    expect(next[0].expiresAt!.getTime()).toBeLessThanOrEqual(
      evidence.expiresAt.getTime(),
    )

    await expect(
      db.organisation.update({
        where: { id: org },
        data: { isFictionalDemo: false },
      }),
    ).rejects.toThrow()

    expect(evidence.expiresAt.getTime()).toBe(
      d.measuredAt + LOCATION_RETENTION_MS,
    )
    const read = await getAttendanceLocation(id)
    expect(read.status).toBe("retained")
    expect(read.coordinates).toEqual({
      latitude: d.latitude,
      longitude: d.longitude,
    })
    expect(read.remainingMs).toBeLessThanOrEqual(LOCATION_RETENTION_MS)
    const audits = await db.auditEvent.findMany({ where: { targetId: id } })
    expect(audits).toHaveLength(1)
    expect(JSON.stringify(audits)).not.toMatch(
      /latitude|longitude|51\.5074|-0\.1278/,
    )
    expect(JSON.stringify(rows)).not.toMatch(/latitude|longitude/)
    await expect(clockIn({ ...d, accuracyMetres: 6 })).rejects.toMatchObject({
      status: 409,
    })
    await expect(clockIn(position())).rejects.toMatchObject({ status: 409 })
    const out = await clockOut({ attendanceId: id, requestId: randomUUID() })
    expect(out).toBeTruthy()
    expect(
      (await db.attendanceRecord.findUniqueOrThrow({ where: { id } }))
        .clockOutVerification,
    ).toBe("NO_LOCATION_REQUIRED_DEMO")
  })
  it.each([
    ["POOR_ACCURACY", { accuracyMetres: 31 }],
    ["STALE_MEASUREMENT", { measuredAt: 1 }],
    ["FUTURE_MEASUREMENT", { measuredAt: Date.now() + 86400000 }],
    ["INVALID_LOCATION", { latitude: 91 }],
    ["INVALID_LOCATION", { longitude: NaN }],
    ["INVALID_LOCATION", { latitude: undefined }],
    ["INVALID_INPUT", { mode: "GPS_LOCATION_RECORDED_DEMO" }],
  ])("rejects %s", async (code, patch) => {
    await expect(
      clockIn({ ...position(), ...patch as object }),
    ).rejects.toMatchObject({ code })
    await noWrite()
  })
  it.each([
    "cancelled",
    "assignment",
    "house",
    "early",
    "late",
    "ended",
    "inactive",
    "revoked",
    "anonymous",
    "coworker",
    "organisation",
  ])("retains %s enforcement", async (kind) => {
    if (kind === "cancelled")
      await db.shift.update({
        where: { id: shift },
        data: { status: "CANCELLED" },
      })
    if (kind === "assignment")
      await db.employeeHouseAssignment.updateMany({
        where: { employeeId: employee },
        data: { active: false },
      })
    if (kind === "house")
      await db.house.update({ where: { id: house }, data: { active: false } })
    if (["early", "late", "ended"].includes(kind))
      await db.shift.update({
        where: { id: shift },
        data: {
          startsAt: new Date(
            Date.now() + (kind === "early" ? 660000 : -3660000),
          ),
          endsAt: new Date(Date.now() + (kind === "ended" ? -1 : 28800000)),
        },
      })
    if (kind === "inactive")
      await db.user.update({
        where: { id: employee },
        data: { status: "INACTIVE" },
      })
    if (kind === "revoked") identity.value!.user.sessionVersion = 999
    if (kind === "anonymous") identity.value = null
    if (kind === "coworker" || kind === "organisation") {
      const tenant =
        kind === "organisation"
          ? (await db.organisation.create({ data: { name: "Other tenant" } }))
              .id
          : org
      const other = await db.user.create({
        data: {
          organisationId: tenant,
          name: "Other worker",
          employeeCode: randomUUID(),
          email: randomUUID() + "@example.test",
          role: "STAFF",
          status: "ACTIVE",
        },
      })
      identity.value = { user: { id: other.id, sessionVersion: 1 } }
    }
    try {
      await expect(clockIn(position())).rejects.toThrow()
      await noWrite()
    } finally {
      if (kind === "house")
        await db.house.update({ where: { id: house }, data: { active: true } })
    }
  })

  it("restricts location evidence to owner and same-organisation management", async () => {
    const id = (await clockIn(position())).attendance!.id
    const other = await db.user.create({
      data: {
        organisationId: org,
        name: "Another worker",
        employeeCode: randomUUID(),
        email: randomUUID() + "@example.test",
        role: "STAFF",
        status: "ACTIVE",
      },
    })
    identity.value = { user: { id: other.id, sessionVersion: 1 } }
    await expect(getAttendanceLocation(id)).rejects.toMatchObject({
      status: 404,
    })
    await expect(getAttendanceLocation(id, true)).rejects.toMatchObject({
      status: 403,
    })
    const manager = await db.user.update({
      where: { id: other.id },
      data: { role: "MANAGER" },
    })
    identity.value = {
      user: { id: manager.id, sessionVersion: manager.sessionVersion },
    }
    expect((await getAttendanceLocation(id, true)).status).toBe("retained")
    const second = await db.organisation.create({
      data: { name: "Other management" },
    })
    const foreign = await db.user.create({
      data: {
        organisationId: second.id,
        name: "Other manager",
        employeeCode: randomUUID(),
        email: randomUUID() + "@example.test",
        role: "MANAGER",
        status: "ACTIVE",
      },
    })
    identity.value = { user: { id: foreign.id, sessionVersion: 1 } }
    await expect(getAttendanceLocation(id, true)).rejects.toMatchObject({
      status: 404,
    })
    identity.value = null
    await expect(getAttendanceLocation(id)).rejects.toMatchObject({
      status: 401,
    })
  })
  it("blocks retrieval exactly at seven days even before scheduled physical deletion", async () => {
    const d = position(),
      id = (await clockIn(d)).attendance!.id
    vi.spyOn(Date, "now").mockReturnValue(d.measuredAt + LOCATION_RETENTION_MS)
    const read = await getAttendanceLocation(id)
    expect(read.status).toBe("expired")
    expect(read.coordinates).toBeNull()
    expect(
      (
        await db.attendanceLocationEvidence.findUniqueOrThrow({
          where: { attendanceId: id },
        })
      ).latitude,
    ).toBe(d.latitude)
  })
  it("physically purges expired coordinates through execute-only role, retaining attendance and immutable audit", async () => {
    // Create an already-expired fixture only in the disposable local cluster.
    const measuredAt = new Date(Date.now() - LOCATION_RETENTION_MS - 60000),
      id = randomUUID()
    await db.$transaction(async (tx) => {
      await tx.attendanceRecord.create({
        data: {
          id,
          organisationId: org,
          employeeId: employee,
          shiftId: shift,
          houseId: house,
          clockIn: measuredAt,
          measuredAt,
          accuracyMetres: 5,
          verification: "GPS_LOCATION_RECORDED_DEMO",
          policyVersion: "demo-retention-test",
          policySnapshot: { mode: "GPS_LOCATION_RECORDED_DEMO" },
          requestId: randomUUID(),
          requestDigest: "a".repeat(64),
        },
      })
      await tx.attendanceLocationEvidence.create({
        data: {
          attendanceId: id,
          organisationId: org,
          latitude: 1,
          longitude: 2,
          expiresAt: new Date(measuredAt.getTime() + LOCATION_RETENTION_MS),
        },
      })
      await tx.auditEvent.create({
        data: {
          organisationId: org,
          actorId: employee,
          action: "attendance.clocked_in",
          targetType: "attendance",
          targetId: id,
          summary: { verification: "GPS_LOCATION_RECORDED_DEMO" },
        },
      })
    })
    const before = await db.attendanceRecord.findUniqueOrThrow({
        where: { id },
      }),
      audits = await db.auditEvent.findMany({ where: { targetId: id } })
    await expect(
      db.$transaction(async (tx) => {
        await tx.$executeRawUnsafe("SET LOCAL ROLE caremetrics_location_purger")
        return tx.$queryRawUnsafe('SELECT * FROM "AttendanceLocationEvidence"')
      }),
    ).rejects.toThrow()
    const count = await db.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("SET LOCAL ROLE caremetrics_location_purger")
      return tx.$queryRawUnsafe<Array<{ count: number }>>(
        "SELECT public.purge_expired_demo_locations() AS count",
      )
    })
    expect(count[0].count).toBeGreaterThanOrEqual(1)
    expect(
      await db.attendanceLocationEvidence.findUniqueOrThrow({
        where: { attendanceId: id },
      }),
    ).toMatchObject({
      latitude: null,
      longitude: null,
      purgedAt: expect.any(Date),
    })
    expect(
      await db.attendanceRecord.findUniqueOrThrow({ where: { id } }),
    ).toEqual(before)
    expect(await db.auditEvent.findMany({ where: { targetId: id } })).toEqual(
      audits,
    )
    expect((await getAttendanceLocation(id)).coordinates).toBeNull()
    await expect(
      db.attendanceLocationEvidence.update({
        where: { attendanceId: id },
        data: { latitude: 1, longitude: 2, purgedAt: null },
      }),
    ).rejects.toThrow()
  })
  it("cannot erase before expiry, edit coordinates, or create demo attendance without evidence", async () => {
    const id = (await clockIn(position())).attendance!.id
    await expect(
      db.attendanceLocationEvidence.update({
        where: { attendanceId: id },
        data: { latitude: 0 },
      }),
    ).rejects.toThrow()
    await expect(
      db.attendanceLocationEvidence.update({
        where: { attendanceId: id },
        data: { latitude: null, longitude: null, purgedAt: new Date() },
      }),
    ).rejects.toThrow()
    await expect(
      db.attendanceLocationEvidence.delete({ where: { attendanceId: id } }),
    ).rejects.toThrow()
    const n = await db.shift.create({
      data: {
        organisationId: org,
        employeeId: employee,
        houseId: house,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 3600000),
      },
    })
    await expect(
      db.attendanceRecord.create({
        data: {
          organisationId: org,
          employeeId: employee,
          shiftId: n.id,
          houseId: house,
          clockIn: new Date(),
          measuredAt: new Date(),
          accuracyMetres: 1,
          verification: "GPS_LOCATION_RECORDED_DEMO",
          policyVersion: "demo-invalid",
          policySnapshot: {},
          requestId: randomUUID(),
          requestDigest: "b".repeat(64),
        },
      }),
    ).rejects.toThrow()
  })
  it("rolls back evidence and attendance if audit fails", async () => {
    await db.$executeRawUnsafe(
      `CREATE FUNCTION fail_recording_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."actorId"='${employee}'::uuid THEN RAISE EXCEPTION 'rollback test'; END IF; RETURN NEW; END; $$`,
    )
    await db.$executeRawUnsafe(
      'CREATE TRIGGER fail_recording_audit BEFORE INSERT ON "AuditEvent" FOR EACH ROW EXECUTE FUNCTION fail_recording_audit()',
    )
    try {
      await expect(clockIn(position())).rejects.toThrow()
      await noWrite()
    } finally {
      await db.$executeRawUnsafe(
        'DROP TRIGGER fail_recording_audit ON "AuditEvent"',
      )
      await db.$executeRawUnsafe("DROP FUNCTION fail_recording_audit()")
    }
  })
})
