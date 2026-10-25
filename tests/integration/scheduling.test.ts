import { beforeAll, afterAll, describe, it, expect, vi } from "vitest"
import { randomUUID } from "node:crypto"
interface UserSession {
  id: string
  sessionVersion: number
}
const identity = vi.hoisted(() => ({
  value: null as { user: UserSession } | null,
}))
vi.mock("../../src/server/auth/index", () => ({
  auth: async () => identity.value,
}))
import { database } from "../../src/server/db"
import {
  saveShift,
  cancelShift,
  getStaffSchedule,
  getAdminSchedule,
} from "../../src/server/scheduling/shifts"
import { assignEmployeeHouses } from "../../src/server/admin/employees"
import { POST as postShift } from "../../src/app/api/admin/shifts/route"
import { GET as getShifts } from "../../src/app/api/shifts/route"
const db = database(),
  suffix = randomUUID()
let org: string,
  admin: string,
  manager: string,
  staff: string,
  senior: string,
  other: string,
  house: string,
  secondHouse: string,
  shiftId: string
async function as(id: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id } })
  identity.value = { user: { id, sessionVersion: user.sessionVersion } }
}
function input(day = "2027-01-10", overrides: Record<string, unknown> = {}) {
  return {
    employeeId: staff,
    houseId: house,
    startsLocal: day + "T09:00",
    endsLocal: day + "T17:00",
    status: "SCHEDULED",
    notes: "Fictional scheduling note",
    ...overrides,
  }
}
beforeAll(async () => {
  org = (
    await db.organisation.create({
      data: { name: `Fictional schedule ${suffix}` },
    })
  ).id
  for (const role of [
    "ADMINISTRATOR",
    "MANAGER",
    "STAFF",
    "SENIOR_STAFF",
  ] as const) {
    const user = await db.user.create({
      data: {
        organisationId: org,
        name: `Fictional ${role}`,
        role,
        status: "ACTIVE",
        employeeCode: role,
        email: `${role}-${suffix}@example.test`.toLowerCase(),
      },
    })
    if (role === "ADMINISTRATOR") admin = user.id
    if (role === "MANAGER") manager = user.id
    if (role === "STAFF") staff = user.id
    if (role === "SENIOR_STAFF") senior = user.id
  }
  other = (
    await db.user.create({
      data: {
        organisationId: org,
        name: "Fictional other worker",
        role: "STAFF",
        status: "ACTIVE",
        employeeCode: "OTHER",
        email: `other-${suffix}@example.test`,
      },
    })
  ).id
  house = (
    await db.house.create({
      data: {
        organisationId: org,
        code: "A",
        name: "Fictional schedule house",
        address: "Fictional address",
      },
    })
  ).id
  secondHouse = (
    await db.house.create({
      data: {
        organisationId: org,
        code: "B",
        name: "Fictional second house",
        address: "Fictional address",
      },
    })
  ).id
  await db.employeeHouseAssignment.create({
    data: { organisationId: org, employeeId: staff, houseId: house },
  })
  await db.employeeHouseAssignment.create({
    data: { organisationId: org, employeeId: other, houseId: secondHouse },
  })
})
afterAll(async () => {
  // Completed fixture evidence is retained; the disposable cluster owns teardown.
  identity.value = null
  await db.$disconnect()
})
describe("authorised PostgreSQL scheduling", () => {
  it("Admin and Manager create stable shifts with trusted assigning identity and transactional audit", async () => {
    await as(admin)
    const created = await saveShift(input())
    shiftId = created.id
    expect(created).toMatchObject({
      employeeId: staff,
      houseId: house,
      assignedBy: "Fictional ADMINISTRATOR",
      status: "SCHEDULED",
      clockInAvailable: false,
    })
    expect(created.startsAt).toBe("2027-01-09T20:00:00.000Z")
    expect(
      (await db.shift.findUniqueOrThrow({ where: { id: created.id } }))
        .assignedById,
    ).toBe(admin)
    await as(manager)
    const managed = await saveShift(input("2027-01-11"))
    const event = await db.auditEvent.findFirstOrThrow({
      where: { targetId: managed.id, action: "shift.created" },
    })
    expect(event.actorId).toBe(manager)
    expect(JSON.stringify(event.summary)).not.toContain(
      "Fictional scheduling note",
    )
  })
  it("accepts omitted optional notes without inventing content", async () => {
    await as(admin)
    const value: Record<string, unknown> = input("2027-02-01")
    delete value.notes
    const row = await saveShift(value)
    expect(row.notes).toBeNull()
    expect(
      (await db.shift.findUniqueOrThrow({ where: { id: row.id } })).notes,
    ).toBeNull()
  })
  it("denies unauthenticated Staff and Senior mutations and management reads", async () => {
    identity.value = null
    await expect(saveShift(input())).rejects.toMatchObject({ status: 401 })
    for (const who of [staff, senior]) {
      await as(who)
      await expect(saveShift(input())).rejects.toMatchObject({ status: 403 })
      await expect(saveShift(input(), shiftId)).rejects.toMatchObject({
        status: 403,
      })
      await expect(cancelShift(shiftId, {})).rejects.toMatchObject({
        status: 403,
      })
      await expect(getAdminSchedule()).rejects.toMatchObject({ status: 403 })
    }
  })
  it("rejects cross-tenant, mismatched or inactive employee/house references", async () => {
    await as(admin)
    const foreignOrg = await db.organisation.create({
      data: { name: "Other fictional schedule tenant" },
    })
    const foreign = await db.house.create({
      data: {
        organisationId: foreignOrg.id,
        code: "X",
        name: "Other",
        address: "Fictional",
      },
    })
    await expect(
      saveShift(input("2027-01-12", { houseId: foreign.id })),
    ).rejects.toMatchObject({ status: 400 })
    await expect(
      saveShift(input("2027-01-12", { houseId: secondHouse })),
    ).rejects.toMatchObject({ status: 400 })
    await db.user.update({ where: { id: staff }, data: { status: "INACTIVE" } })
    try {
      await expect(saveShift(input("2027-01-12"))).rejects.toMatchObject({
        status: 400,
      })
    } finally {
      await db.user.update({ where: { id: staff }, data: { status: "ACTIVE" } })
    }
    await db.house.update({ where: { id: house }, data: { active: false } })
    try {
      await expect(saveShift(input("2027-01-12"))).rejects.toMatchObject({
        status: 400,
      })
    } finally {
      await db.house.update({ where: { id: house }, data: { active: true } })
    }
  })
  it("rejects invalid ranges/status/IDs and missing or ambiguous NZ DST wall times", async () => {
    await as(admin)
    const count = await db.auditEvent.count({ where: { organisationId: org } })
    for (const overrides of [
      { startsLocal: "bad" },
      { endsLocal: "2027-01-10T08:00" },
      { endsLocal: "2027-01-10T09:00" },
      { status: "CANCELLED" },
      { startsLocal: "2026-09-27T02:30", endsLocal: "2026-09-27T04:00" },
      { startsLocal: "2027-04-04T02:30", endsLocal: "2027-04-04T04:00" },
    ])
      await expect(
        saveShift(input("2027-01-10", overrides)),
      ).rejects.toMatchObject({ status: 400 })
    await expect(saveShift(input(), "not-id")).rejects.toMatchObject({
      status: 400,
    })
    expect(await db.auditEvent.count({ where: { organisationId: org } })).toBe(
      count,
    )
  })
  it("stores overnight/year boundaries and both NZ DST transition durations chronologically", async () => {
    await as(admin)
    const overnight = await saveShift(
      input("2027-12-31", {
        startsLocal: "2027-12-31T22:00",
        endsLocal: "2028-01-01T06:00",
      }),
    )
    expect(Date.parse(overnight.endsAt) - Date.parse(overnight.startsAt)).toBe(
      8 * 3600000,
    )
    const spring = await saveShift(
      input("2026-09-27", {
        startsLocal: "2026-09-27T01:00",
        endsLocal: "2026-09-27T04:00",
      }),
    )
    const autumn = await saveShift(
      input("2027-04-04", {
        startsLocal: "2027-04-04T01:00",
        endsLocal: "2027-04-04T04:00",
      }),
    )
    expect(Date.parse(spring.endsAt) - Date.parse(spring.startsAt)).toBe(
      2 * 3600000,
    )
    expect(Date.parse(autumn.endsAt) - Date.parse(autumn.startsAt)).toBe(
      4 * 3600000,
    )
  })
  it("rejects overlaps, allows touching boundaries, and serialises competing creates", async () => {
    await as(admin)
    await expect(
      saveShift(
        input("2027-01-10", {
          startsLocal: "2027-01-10T16:00",
          endsLocal: "2027-01-10T18:00",
        }),
      ),
    ).rejects.toMatchObject({ status: 409 })
    await saveShift(
      input("2027-01-10", {
        startsLocal: "2027-01-10T17:00",
        endsLocal: "2027-01-10T18:00",
      }),
    )
    const count = await db.auditEvent.count({ where: { organisationId: org } })
    const attempts = await Promise.allSettled([
      saveShift(input("2027-01-13")),
      saveShift(input("2027-01-13")),
    ])
    expect(attempts.filter((r) => r.status === "fulfilled")).toHaveLength(1)
    expect(await db.auditEvent.count({ where: { organisationId: org } })).toBe(
      count + 1,
    )
  })
  it("edits without changing IDs/creator, rejects stale edits, cancels without deletion", async () => {
    await as(admin)
    const original = await db.shift.findUniqueOrThrow({
      where: { id: shiftId },
    })
    const updated = await saveShift(
      input("2027-01-10", {
        endsLocal: "2027-01-10T16:30",
        expectedUpdatedAt: original.updatedAt.toISOString(),
        notes: "Fictional edited",
      }),
      shiftId,
    )
    expect(updated.id).toBe(shiftId)
    expect(updated.assignedBy).toBe("Fictional ADMINISTRATOR")
    await expect(
      saveShift(
        input("2027-01-10", {
          expectedUpdatedAt: original.updatedAt.toISOString(),
        }),
        shiftId,
      ),
    ).rejects.toMatchObject({ status: 409 })
    const cancelled = await cancelShift(shiftId, {
      confirmed: true,
      expectedUpdatedAt: updated.updatedAt,
    })
    expect(cancelled).toMatchObject({
      id: shiftId,
      status: "CANCELLED",
      clockInAvailable: false,
    })
    expect(await db.shift.findUnique({ where: { id: shiftId } })).not.toBeNull()
    await as(staff)
    const own = await getStaffSchedule({ month: "2027-01", shiftId })
    expect(own.detail?.status).toBe("CANCELLED")
    expect(own.upcoming.map((s) => s.id)).not.toContain(shiftId)
  })
  it("protects any referenced attendance against edits/cancellation and retains exact timestamps", async () => {
    await as(admin)
    const row = await saveShift(input("2027-01-14"))
    const attendance = await db.attendanceRecord.create({
      data: {
        organisationId: org,
        shiftId: row.id,
        employeeId: staff,
        clockIn: new Date(row.startsAt),
        clockOut: new Date(row.endsAt),
      },
    })
    const count = await db.auditEvent.count({ where: { organisationId: org } })
    await expect(
      saveShift(
        input("2027-01-14", { expectedUpdatedAt: row.updatedAt }),
        row.id,
      ),
    ).rejects.toMatchObject({ status: 409 })
    await expect(
      cancelShift(row.id, {
        confirmed: true,
        expectedUpdatedAt: row.updatedAt,
      }),
    ).rejects.toMatchObject({ status: 409 })
    expect(
      await db.attendanceRecord.findUniqueOrThrow({
        where: { id: attendance.id },
      }),
    ).toEqual(attendance)
    expect(await db.auditEvent.count({ where: { organisationId: org } })).toBe(
      count,
    )
  })
  it("Staff reads are own/current-house scoped across details, upcoming and month navigation", async () => {
    await as(admin)
    const otherShift = await saveShift(
      input("2027-01-15", { employeeId: other, houseId: secondHouse }),
    )
    await as(staff)
    const data = await getStaffSchedule({ month: "2027-01" })
    expect(data.shifts.every((s) => s.employeeId === staff)).toBe(true)
    expect(data.shifts.map((s) => s.id)).not.toContain(otherShift.id)
    await expect(
      getStaffSchedule({ shiftId: otherShift.id }),
    ).rejects.toMatchObject({ status: 404 })
    await expect(getStaffSchedule({ employee: other })).rejects.toMatchObject({
      status: 400,
    })
    await expect(
      getStaffSchedule({ house: secondHouse }),
    ).rejects.toMatchObject({ status: 404 })
    expect(data.upcoming).toHaveLength(3)
    expect(JSON.stringify(data)).not.toMatch(
      /passwordHash|sessionVersion|organisationId|Fictional MANAGER.*email/,
    )
  })
  it("assignment removal and scheduling use the same dependency/authority boundary", async () => {
    await as(admin)
    const user = await db.user.findUniqueOrThrow({ where: { id: staff } })
    await expect(
      assignEmployeeHouses(staff, {
        houseIds: [],
        expectedUpdatedAt: user.updatedAt.toISOString(),
      }),
    ).rejects.toMatchObject({ status: 409 })
    await db.employeeHouseAssignment.update({
      where: {
        organisationId_employeeId_houseId: {
          organisationId: org,
          employeeId: staff,
          houseId: house,
        },
      },
      data: { active: false },
    })
    try {
      await expect(saveShift(input("2027-01-16"))).rejects.toMatchObject({
        status: 400,
      })
      await as(staff)
      expect((await getStaffSchedule()).upcoming).toEqual([])
      await expect(getStaffSchedule({ shiftId })).rejects.toMatchObject({
        status: 404,
      })
    } finally {
      await db.employeeHouseAssignment.update({
        where: {
          organisationId_employeeId_houseId: {
            organisationId: org,
            employeeId: staff,
            houseId: house,
          },
        },
        data: { active: true },
      })
    }
  })
  it("HTTP errors never fall back to mock shifts; origin and auth are independently checked", async () => {
    const request = (origin: string) =>
      new Request("http://localhost:8558/api/admin/shifts", {
        method: "POST",
        headers: { Origin: origin, "Content-Type": "application/json" },
        body: JSON.stringify(input("2027-01-20")),
      })
    await as(admin)
    expect((await postShift(request("https://untrusted.example"))).status).toBe(
      403,
    )
    await as(staff)
    expect((await postShift(request("http://localhost:8558"))).status).toBe(403)
    const failure = vi
      .spyOn(db.shift, "findMany")
      .mockRejectedValueOnce(new Error("private database failure"))
    try {
      const response = await getShifts(
        new Request("http://localhost:8558/api/shifts"),
      )
      expect(response.status).toBe(503)
      expect(await response.json()).toEqual({ error: "Service unavailable" })
    } finally {
      failure.mockRestore()
    }
  })
})
