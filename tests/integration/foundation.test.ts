import { describe, it, expect, beforeAll, afterAll, vi } from "vitest"
import { readFile } from "node:fs/promises"
import { randomUUID } from "node:crypto"
import { seedIds as id, seedEmployees } from "../../prisma/seed-data"
const identity = vi.hoisted(() => ({
  value: null as {
    user: {
      id: string
      sessionVersion: number
    }
  } | null,
}))
vi.mock("../../src/server/auth/index", () => ({
  auth: async () => identity.value,
}))
import { database } from "../../src/server/db"
import {
  requireEmployee,
  requireManagement,
  requireCapability,
} from "../../src/server/auth/access"
import {
  requireClient,
  requireHouse,
  getAssignedHouses,
  getHouseClients,
} from "../../src/server/data/access"
import { authenticateCredentials } from "../../src/server/auth/credentials"
import { checkPassword } from "../../src/server/auth/password"
import { apiError } from "../../src/server/errors"
import { GET as currentEmployeeResponse } from "../../src/app/api/me/route"
const db = database()
let credentials: Record<string, string>
async function as(employeeId: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: employeeId } })
  identity.value = {
    user: { id: employeeId, sessionVersion: user.sessionVersion },
  }
}
beforeAll(async () => {
  credentials = JSON.parse(
    await readFile(process.env.CAREMETRICS_SEED_CREDENTIALS_FILE!, "utf8"),
  )
})
afterAll(async () => {
  identity.value = null
  await db.$disconnect()
})
describe("isolated migrated PostgreSQL foundation", () => {
  it("repeat seed keeps stable users, assignments, contacts and published version", async () => {
    expect(await db.user.count()).toBe(5)
    expect(await db.employeeHouseAssignment.count()).toBe(4)
    expect(await db.clientContact.count()).toBe(3)
    expect(await db.careTemplateVersion.count()).toBe(1)
  })
  it("requires a trusted active session and excludes sensitive employee data", async () => {
    identity.value = null
    await expect(requireEmployee()).rejects.toMatchObject({ status: 401 })
    await as(id.staffA)
    const employee = await requireEmployee()
    expect(employee.id).toBe(id.staffA)
    expect("passwordHash" in employee).toBe(false)
    expect("sessionVersion" in employee).toBe(false)
    identity.value = { user: { id: randomUUID(), sessionVersion: 1 } }
    await expect(requireEmployee()).rejects.toMatchObject({ status: 401 })
  })
  it("house/client/NOK queries deny another house and malicious IDs independently of the UI", async () => {
    await as(id.staffA)
    expect((await getAssignedHouses()).map((h) => h.id)).toEqual([id.houseA])
    expect((await requireClient(id.clientA)).contacts[0].name).toBe(
      "Fictional NOK",
    )
    expect((await getHouseClients(id.houseA)).length).toBe(2)
    await expect(requireClient(id.clientB)).rejects.toMatchObject({
      status: 404,
    })
    await expect(requireHouse(id.houseB)).rejects.toMatchObject({ status: 404 })
    await expect(requireClient("' OR true --")).rejects.toMatchObject({
      status: 400,
    })
  })
  it("immediately follows assignment changes, inactive houses and client transfers without changing IDs", async () => {
    await as(id.staffA)
    const key = {
      organisationId_employeeId_houseId: {
        organisationId: id.organisation,
        employeeId: id.staffA,
        houseId: id.houseA,
      },
    }
    await db.employeeHouseAssignment.update({
      where: key,
      data: { active: false },
    })
    try {
      await expect(requireClient(id.clientA)).rejects.toMatchObject({
        status: 404,
      })
    } finally {
      await db.employeeHouseAssignment.update({
        where: key,
        data: { active: true },
      })
    }
    await db.client.update({
      where: { id: id.clientA },
      data: { houseId: id.houseB },
    })
    try {
      await expect(requireClient(id.clientA)).rejects.toMatchObject({
        status: 404,
      })
    } finally {
      await db.client.update({
        where: { id: id.clientA },
        data: { houseId: id.houseA },
      })
    }
    await db.house.update({ where: { id: id.houseA }, data: { active: false } })
    try {
      await expect(requireClient(id.clientA)).rejects.toMatchObject({
        status: 404,
      })
    } finally {
      await db.house.update({
        where: { id: id.houseA },
        data: { active: true },
      })
    }
  })
  it("distinguishes Staff/Senior/Manager/Administrator and rejects unknown capabilities", async () => {
    for (const who of [id.staffA, id.senior]) {
      await as(who)
      await expect(requireManagement()).rejects.toMatchObject({ status: 403 })
    }
    await as(id.senior)
    expect((await getAssignedHouses()).length).toBe(2)
    await as(id.manager)
    expect((await requireManagement()).role).toBe("MANAGER")
    await expect(
      requireCapability("admin.accountAdministration"),
    ).rejects.toMatchObject({ status: 403 })
    await as(id.admin)
    await requireCapability("admin.accountAdministration")
    await expect(
      requireCapability("files.privateUploads"),
    ).rejects.toMatchObject({ status: 403 })
    await expect(requireCapability("unknown")).rejects.toMatchObject({
      status: 403,
    })
  })
  it("rechecks role changes and invalidates sessions across deactivation/reactivation", async () => {
    await as(id.staffB)
    const old = identity.value
    await db.user.update({
      where: { id: id.staffB },
      data: { role: "MANAGER" },
    })
    expect((await requireManagement()).role).toBe("MANAGER")
    await db.user.update({
      where: { id: id.staffB },
      data: { role: "STAFF", status: "INACTIVE" },
    })
    await expect(requireEmployee()).rejects.toMatchObject({ status: 401 })
    await db.user.update({
      where: { id: id.staffB },
      data: { status: "ACTIVE" },
    })
    identity.value = old
    await expect(requireEmployee()).rejects.toMatchObject({ status: 401 })
  })
  it("enforces tenant boundaries in services and composite foreign keys", async () => {
    const org = await db.organisation.create({
      data: { name: "Other fictional tenant" },
    })
    const house = await db.house.create({
      data: {
        organisationId: org.id,
        code: "OTHER",
        name: "Other House",
        address: "Fictional",
      },
    })
    const client = await db.client.create({
      data: {
        organisationId: org.id,
        houseId: house.id,
        reference: "OTHER",
        name: "Other Fiction",
      },
    })
    try {
      await as(id.admin)
      await expect(requireClient(client.id)).rejects.toMatchObject({
        status: 404,
      })
      await expect(
        db.employeeHouseAssignment.create({
          data: {
            organisationId: id.organisation,
            employeeId: id.staffA,
            houseId: house.id,
          },
        }),
      ).rejects.toMatchObject({ code: "P2003" })
    } finally {
      await db.client.delete({ where: { id: client.id } })
      await db.house.delete({ where: { id: house.id } })
      await db.organisation.delete({ where: { id: org.id } })
    }
  })
  it("enforces unique assignments, attendance/employee matching and valid times/coordinates", async () => {
    await expect(
      db.employeeHouseAssignment.create({
        data: {
          organisationId: id.organisation,
          employeeId: id.staffA,
          houseId: id.houseA,
        },
      }),
    ).rejects.toMatchObject({ code: "P2002" })
    await expect(
      db.attendanceRecord.create({
        data: {
          organisationId: id.organisation,
          employeeId: id.staffB,
          shiftId: id.shiftA,
        },
      }),
    ).rejects.toMatchObject({ code: "P2003" })
    await expect(
      db.house.update({
        where: { id: id.houseA },
        data: { latitude: 91, longitude: 0 },
      }),
    ).rejects.toBeDefined()
    await expect(
      db.shift.update({
        where: { id: id.shiftA },
        data: { endsAt: new Date("2020-01-01") },
      }),
    ).rejects.toBeDefined()
  })
  it("protects published definitions and exact-version immutable submitted originals", async () => {
    await expect(
      db.careTemplateVersion.update({
        where: { id: id.version },
        data: { definition: {} },
      }),
    ).rejects.toBeDefined()
    await expect(
      db.careTemplateVersion.delete({ where: { id: id.version } }),
    ).rejects.toBeDefined()
    await expect(
      db.careRecord.create({
        data: {
          organisationId: id.organisation,
          clientId: id.clientA,
          authorId: id.staffA,
          templateId: id.template,
          templateVersion: 99,
          values: {},
          coveredAt: new Date(),
        },
      }),
    ).rejects.toMatchObject({ code: "P2003" })
    const record = await db.careRecord.create({
      data: {
        organisationId: id.organisation,
        clientId: id.clientA,
        authorId: id.staffA,
        templateId: id.template,
        templateVersion: 1,
        values: { notes: "Fictional original" },
        coveredAt: new Date(),
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    })
    await expect(
      db.careRecord.update({ where: { id: record.id }, data: { values: {} } }),
    ).rejects.toBeDefined()
    await expect(
      db.careRecord.delete({ where: { id: record.id } }),
    ).rejects.toBeDefined()
    const diary = await db.clientDiaryEntry.create({
      data: {
        organisationId: id.organisation,
        clientId: id.clientA,
        houseId: id.houseA,
        authorId: id.staffA,
        title: "Test original",
        category: "Fictional",
        content: "Fictional immutable history",
        coveredAt: new Date(),
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    })
    await expect(
      db.clientDiaryEntry.update({
        where: { id: diary.id },
        data: { content: "changed" },
      }),
    ).rejects.toBeDefined()
  })
  it("verifies Argon2id credentials, rejects unknown/invalid/inactive inputs, persists throttles", async () => {
    await db.loginAttempt.deleteMany()
    const employee = seedEmployees.find((e) => e.id === id.staffA)!
    const password = credentials[employee.email]
    expect(
      (
        await authenticateCredentials({
          email: employee.email.toUpperCase(),
          password,
          role: "ADMINISTRATOR",
          employeeId: id.admin,
        })
      )?.id,
    ).toBe(id.staffA)
    expect(
      await authenticateCredentials({
        email: employee.email,
        password: "incorrect",
      }),
    ).toBeNull()
    expect(
      await authenticateCredentials({
        email: "unknown@caremetrics.example.test",
        password,
      }),
    ).toBeNull()
    expect(await authenticateCredentials({ email: [], password })).toBeNull()
    await db.user.update({
      where: { id: id.staffA },
      data: { status: "INACTIVE" },
    })
    try {
      expect(
        await authenticateCredentials({ email: employee.email, password }),
      ).toBeNull()
    } finally {
      await db.user.update({
        where: { id: id.staffA },
        data: { status: "ACTIVE" },
      })
    }
    const user = await db.user.findUniqueOrThrow({ where: { id: id.staffA } })
    expect(user.passwordHash?.startsWith("$argon2id$")).toBe(true)
    expect(await checkPassword(password, user.passwordHash)).toBe(true)
    await db.loginAttempt.deleteMany()
    const results = await Promise.all(
      Array.from({ length: 8 }, () =>
        authenticateCredentials({
          email: employee.email,
          password: "incorrect",
        }),
      ),
    )
    expect(results.every((r) => r === null)).toBe(true)
    expect(
      await authenticateCredentials({ email: employee.email, password }),
    ).toBeNull()
    expect(
      (await db.loginAttempt.findMany()).some((r) => r.attempts === 5),
    ).toBe(true)
    await db.loginAttempt.deleteMany()
  })
  it("returns a safe service error when the database fails after authentication", async () => {
    await as(id.staffA)
    const failure = vi
      .spyOn(db.user, "findFirst")
      .mockRejectedValueOnce(new Error("sensitive connection failure"))
    try {
      const response = await currentEmployeeResponse()
      expect(response.status).toBe(503)
      expect(await response.json()).toEqual({ error: "Service unavailable" })
    } finally {
      failure.mockRestore()
    }
  })
  it("sanitises unexpected database/configuration errors", () => {
    expect(
      apiError(new Error("sensitive internal connection detail")).status,
    ).toBe(503)
  })
})
