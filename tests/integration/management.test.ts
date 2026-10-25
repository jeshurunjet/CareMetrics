import { beforeAll, afterAll, describe, it, expect, vi } from "vitest"
import { randomUUID, randomBytes } from "node:crypto"
interface SessionUser {
  id: string
  sessionVersion: number
}
const identity = vi.hoisted(() => ({
  value: null as { user: SessionUser } | null,
}))
vi.mock("../../src/server/auth/index", () => ({
  auth: async () => identity.value,
}))
import { hashPassword } from "../../src/server/auth/password"
import { database } from "../../src/server/db"
import {
  createEmployee,
  editEmployee,
  assignEmployeeHouses,
  setEmployeeStatus,
} from "../../src/server/admin/employees"
import { createHouse, editHouse } from "../../src/server/admin/houses"
import {
  createClient,
  editClient,
  saveClientContacts,
  transferClient,
} from "../../src/server/admin/clients"
import {
  requireEmployee,
  requireManagement,
} from "../../src/server/auth/access"
import { requireClient, requireHouse } from "../../src/server/data/access"
import { getClientProfile, searchStaff } from "../../src/server/data/staff"
import { POST as postEmployee } from "../../src/app/api/admin/employees/route"
import { PATCH as patchHouse } from "../../src/app/api/admin/houses/[id]/route"
const db = database()
const suffix = randomUUID()
let org: string,
  admin: string,
  manager: string,
  staff: string,
  senior: string,
  houseA: string,
  houseB: string,
  client: string,
  employee: string
let hash: string
async function as(id: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id } })
  identity.value = { user: { id, sessionVersion: user.sessionVersion } }
}
async function version(model: "user" | "house" | "client", id: string) {
  const row =
    model === "user"
      ? await db.user.findUniqueOrThrow({ where: { id } })
      : model === "house"
        ? await db.house.findUniqueOrThrow({ where: { id } })
        : await db.client.findUniqueOrThrow({ where: { id } })
  return row.updatedAt.toISOString()
}
function emp(overrides: Record<string, unknown> = {}) {
  return {
    name: "Fictional employee",
    employeeCode: "TEST-EMP",
    email: `employee-${suffix}@example.test`,
    role: "STAFF",
    status: "INVITED",
    houseIds: [],
    ...overrides,
  }
}
function house(code: string) {
  return {
    name: `Fictional ${code}`,
    code,
    address: "Fictional development address",
    phone: "000 000 0000",
    email: "",
    active: true,
    latitude: null,
    longitude: null,
  }
}
async function clientInput() {
  const c = await db.client.findUniqueOrThrow({ where: { id: client } })
  return {
    name: c.name,
    preferredName: c.preferredName ?? "",
    reference: c.reference,
    dateOfBirth: c.dateOfBirth?.toISOString().slice(0, 10) ?? "",
    summary: c.summary ?? "",
    houseId: c.houseId,
    active: c.active,
    expectedUpdatedAt: c.updatedAt.toISOString(),
  }
}
async function houseInput(id: string) {
  const h = await db.house.findUniqueOrThrow({ where: { id } })
  return {
    ...house(h.code),
    name: h.name,
    address: h.address,
    phone: h.phone ?? "",
    email: h.email ?? "",
    active: h.active,
    latitude: h.latitude === null ? null : Number(h.latitude),
    longitude: h.longitude === null ? null : Number(h.longitude),
    expectedUpdatedAt: h.updatedAt.toISOString(),
  }
}
beforeAll(async () => {
  hash = await hashPassword(randomBytes(32).toString("base64url"))
  org = (
    await db.organisation.create({
      data: { name: `Fictional management test ${suffix}` },
    })
  ).id
  for (const role of [
    "ADMINISTRATOR",
    "MANAGER",
    "STAFF",
    "SENIOR_STAFF",
  ] as const) {
    const u = await db.user.create({
      data: {
        organisationId: org,
        name: `Fictional ${role}`,
        employeeCode: role,
        email: `${role.toLowerCase()}-${suffix}@example.test`,
        role,
        status: "ACTIVE",
        passwordHash: hash,
      },
    })
    if (role === "ADMINISTRATOR") admin = u.id
    if (role === "MANAGER") manager = u.id
    if (role === "STAFF") staff = u.id
    if (role === "SENIOR_STAFF") senior = u.id
  }
  await as(admin)
  houseA = (await createHouse(house("CORE-A"))).id
  houseB = (await createHouse(house("CORE-B"))).id
  const u = await db.user.findUniqueOrThrow({ where: { id: staff } })
  await assignEmployeeHouses(staff, {
    houseIds: [houseA],
    expectedUpdatedAt: u.updatedAt.toISOString(),
  })
  client = (
    await createClient({
      name: "Fictional management client",
      preferredName: "Fiction",
      reference: "CORE-CLIENT",
      dateOfBirth: "2000-01-01",
      summary: "Fictional only",
      houseId: houseA,
      active: true,
    })
  ).id
})
afterAll(async () => {
  identity.value = null
  await db.$disconnect()
})
describe("transactional management services on disposable PostgreSQL", () => {
  it("creates an invited employee without credentials and records minimal audit events", async () => {
    await as(admin)
    employee = (await createEmployee(emp({ houseIds: [houseA] }))).id
    const row = await db.user.findUniqueOrThrow({ where: { id: employee } })
    expect(row.passwordHash).toBeNull()
    expect(row.status).toBe("INVITED")
    const events = await db.auditEvent.findMany({
      where: { organisationId: org, targetId: employee },
    })
    expect(events.map((e) => e.action)).toContain("employee.created")
    expect(JSON.stringify(events)).not.toContain(row.email)
    expect(events.every((e) => e.actorId === admin)).toBe(true)
    await expect(
      setEmployeeStatus(employee, {
        status: "ACTIVE",
        expectedUpdatedAt: row.updatedAt.toISOString(),
      }),
    ).rejects.toMatchObject({ status: 409 })
  })
  it("rejects duplicate codes/emails and untrusted extra fields with no success audit", async () => {
    await as(admin)
    const count = await db.auditEvent.count({ where: { organisationId: org } })
    await expect(
      createEmployee(
        emp({
          email: `different-${suffix}@example.test`,
          employeeCode: "test-emp",
        }),
      ),
    ).rejects.toMatchObject({ status: 409 })
    await expect(
      createEmployee(emp({ employeeCode: "OTHER" })),
    ).rejects.toMatchObject({ status: 409 })
    await expect(
      createEmployee(emp({ organisationId: randomUUID() })),
    ).rejects.toMatchObject({ status: 400 })
    expect(await db.auditEvent.count({ where: { organisationId: org } })).toBe(
      count,
    )
  })
  it("denies unauthenticated Staff and Senior writes independently of browser roles", async () => {
    identity.value = null
    await expect(createHouse(house("DENIED"))).rejects.toMatchObject({
      status: 401,
    })
    for (const id of [staff, senior]) {
      await as(id)
      await expect(createHouse(house("DENIED"))).rejects.toMatchObject({
        status: 403,
      })
    }
  })
  it("blocks Manager role changes, self promotion and Administrator target changes", async () => {
    await as(manager)
    const m = await db.user.findUniqueOrThrow({ where: { id: manager } })
    await expect(
      editEmployee(
        manager,
        emp({
          employeeCode: m.employeeCode,
          email: m.email,
          name: m.name,
          role: "ADMINISTRATOR",
          status: "ACTIVE",
          expectedUpdatedAt: m.updatedAt.toISOString(),
        }),
      ),
    ).rejects.toMatchObject({ status: 403 })
    await expect(
      assignEmployeeHouses(admin, {
        houseIds: [houseA],
        expectedUpdatedAt: await version("user", admin),
      }),
    ).rejects.toMatchObject({ status: 403 })
    await expect(
      createEmployee(
        emp({
          employeeCode: "MANAGER-CREATE",
          email: `managercreate-${suffix}@example.test`,
          role: "MANAGER",
        }),
      ),
    ).rejects.toMatchObject({ status: 403 })
  })
  it("permits Manager core mutations and records their authenticated actor", async () => {
    await as(manager)
    const created = await createEmployee(
      emp({
        employeeCode: "MANAGER-STAFF",
        email: `manager-staff-${suffix}@example.test`,
        houseIds: [houseA],
      }),
    )
    expect(
      (await db.user.findUniqueOrThrow({ where: { id: created.id } })).status,
    ).toBe("INVITED")
    await editHouse(houseB, {
      ...(await houseInput(houseB)),
      phone: "000 777 8888",
    })
    const events = await db.auditEvent.findMany({
      where: { organisationId: org, targetId: created.id },
    })
    expect(events.every((event) => event.actorId === manager)).toBe(true)
  })
  it("rejects foreign-tenant and invalid IDs without record changes", async () => {
    await as(admin)
    const otherOrg = await db.organisation.create({
      data: { name: "Other fictional mutation tenant" },
    })
    const foreign = await db.house.create({
      data: {
        organisationId: otherOrg.id,
        name: "Other fictional house",
        code: "FOREIGN",
        address: "Fictional",
      },
    })
    await expect(
      editHouse(foreign.id, {
        ...house("FOREIGN"),
        expectedUpdatedAt: foreign.updatedAt.toISOString(),
      }),
    ).rejects.toMatchObject({ status: 404 })
    await expect(
      assignEmployeeHouses(employee, {
        houseIds: [foreign.id],
        expectedUpdatedAt: await version("user", employee),
      }),
    ).rejects.toMatchObject({ status: 400 })
    await expect(editHouse("invalid", {})).rejects.toMatchObject({
      status: 400,
    })
    await expect(
      transferClient(client, {
        houseId: randomUUID(),
        confirmed: true,
        expectedUpdatedAt: await version("client", client),
      }),
    ).rejects.toMatchObject({ status: 404 })
  })
  it("assignment add/remove immediately changes protected Staff access", async () => {
    await as(admin)
    await assignEmployeeHouses(staff, {
      houseIds: [houseA, houseB],
      expectedUpdatedAt: await version("user", staff),
    })
    await as(staff)
    expect((await requireHouse(houseB)).id).toBe(houseB)
    await as(admin)
    await assignEmployeeHouses(staff, {
      houseIds: [houseA],
      expectedUpdatedAt: await version("user", staff),
    })
    await as(staff)
    await expect(requireHouse(houseB)).rejects.toMatchObject({ status: 404 })
  })
  it("blocks scheduled assignment removal transactionally without cancelling history", async () => {
    const shift = await db.shift.create({
      data: {
        organisationId: org,
        employeeId: staff,
        houseId: houseA,
        startsAt: new Date(Date.now() + 86400000),
        endsAt: new Date(Date.now() + 90000000),
      },
    })
    await as(admin)
    const count = await db.auditEvent.count({ where: { organisationId: org } })
    await expect(
      assignEmployeeHouses(staff, {
        houseIds: [],
        expectedUpdatedAt: await version("user", staff),
      }),
    ).rejects.toMatchObject({ status: 409 })
    expect(
      (await db.shift.findUniqueOrThrow({ where: { id: shift.id } })).status,
    ).toBe("SCHEDULED")
    expect(await db.auditEvent.count({ where: { organisationId: org } })).toBe(
      count,
    )
    await as(staff)
    await requireClient(client)
  })
  it("persists paired provisional coordinates and prevents unsafe house deactivation", async () => {
    await as(admin)
    const before = await houseInput(houseA)
    await expect(
      editHouse(houseA, { ...before, latitude: 91, longitude: 174 }),
    ).rejects.toMatchObject({ status: 400 })
    await expect(
      editHouse(houseA, { ...before, latitude: null, longitude: 174 }),
    ).rejects.toMatchObject({ status: 400 })
    await editHouse(houseA, {
      ...before,
      latitude: -36.8,
      longitude: 174.7,
      phone: "000 111 2222",
    })
    await as(staff)
    expect((await requireHouse(houseA)).phone).toBe("000 111 2222")
    await as(admin)
    await expect(
      editHouse(houseA, { ...(await houseInput(houseA)), active: false }),
    ).rejects.toMatchObject({ status: 409 })
    expect(
      (await db.house.findUniqueOrThrow({ where: { id: houseA } })).active,
    ).toBe(true)
  })
  it("allows clean house activation/deactivation and client soft status without deletion", async () => {
    await as(admin)
    const empty = (await createHouse(house("EMPTY"))).id
    await editHouse(empty, { ...(await houseInput(empty)), active: false })
    expect(
      (await db.house.findUniqueOrThrow({ where: { id: empty } })).active,
    ).toBe(false)
    await editHouse(empty, { ...(await houseInput(empty)), active: true })
    await editClient(client, { ...(await clientInput()), active: false })
    await as(staff)
    await expect(requireClient(client)).rejects.toMatchObject({ status: 404 })
    await as(admin)
    await editClient(client, { ...(await clientInput()), active: true })
  })
  it("persists NOK and enforces primary-contact uniqueness and controlled removal", async () => {
    await as(admin)
    const value = {
      name: "Fictional relative",
      relationship: "Whānau",
      phone: "000 123 4567",
      email: "",
      isPrimary: true,
      isEmergency: true,
    }
    await saveClientContacts(client, {
      contacts: [value],
      confirmedRemovalIds: [],
      expectedUpdatedAt: await version("client", client),
    })
    await as(staff)
    expect((await getClientProfile(client)).contacts[0].phone).toBe(value.phone)
    await as(admin)
    const before = await version("client", client)
    await expect(
      saveClientContacts(client, {
        contacts: [value, value],
        confirmedRemovalIds: [],
        expectedUpdatedAt: before,
      }),
    ).rejects.toMatchObject({ status: 400 })
    await expect(
      saveClientContacts(client, {
        contacts: [],
        confirmedRemovalIds: [],
        expectedUpdatedAt: before,
      }),
    ).rejects.toMatchObject({ status: 409 })
    const old = await db.clientContact.findMany({ where: { clientId: client } })
    await expect(
      db.clientContact.create({
        data: { organisationId: org, clientId: client, ...value },
      }),
    ).rejects.toMatchObject({ code: "P2002" })
    await saveClientContacts(client, {
      contacts: [],
      confirmedRemovalIds: old.map((c) => c.id),
      expectedUpdatedAt: before,
    })
    expect(await db.clientContact.count({ where: { clientId: client } })).toBe(
      0,
    )
  })
  it("rolls back a client and its audit when nested NOK validation fails", async () => {
    await as(admin)
    const count = await db.auditEvent.count({ where: { organisationId: org } })
    await expect(
      createClient({
        ...(await clientInput()),
        reference: "FAIL-NOK",
        contacts: [{ name: "" }],
        expectedUpdatedAt: undefined,
      }),
    ).rejects.toMatchObject({ status: 400 })
    expect(
      await db.client.count({
        where: { organisationId: org, reference: "FAIL-NOK" },
      }),
    ).toBe(0)
    expect(await db.auditEvent.count({ where: { organisationId: org } })).toBe(
      count,
    )
  })
  it("transfers preserve IDs, NOK, template assignments and immutable historical references", async () => {
    await as(admin)
    await saveClientContacts(client, {
      contacts: [
        {
          name: "Fictional transfer contact",
          relationship: "Relative",
          phone: "",
          email: "",
          isPrimary: true,
          isEmergency: false,
        },
      ],
      confirmedRemovalIds: [],
      expectedUpdatedAt: await version("client", client),
    })
    const original = await db.clientDiaryEntry.create({
      data: {
        organisationId: org,
        clientId: client,
        houseId: houseA,
        authorId: staff,
        title: "Fictional original",
        category: "Test",
        content: "Fictional history",
        coveredAt: new Date(),
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    })
    const template = await db.careTemplate.create({
      data: { organisationId: org, name: "Fictional transfer template" },
    })
    await db.careTemplateVersion.create({
      data: {
        organisationId: org,
        templateId: template.id,
        version: 1,
        definition: { sections: [] },
      },
    })
    const assignment = await db.clientTemplateAssignment.create({
      data: {
        organisationId: org,
        clientId: client,
        templateId: template.id,
        version: 1,
      },
    })
    const care = await db.careRecord.create({
      data: {
        organisationId: org,
        clientId: client,
        authorId: staff,
        templateId: template.id,
        templateVersion: 1,
        values: { notes: "Fictional preserved" },
        coveredAt: new Date(),
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    })
    const contactsBefore = (
      await db.clientContact.findMany({ where: { clientId: client } })
    ).map((c) => c.id)
    await transferClient(client, {
      houseId: houseB,
      confirmed: true,
      expectedUpdatedAt: await version("client", client),
    })
    await as(staff)
    await expect(requireClient(client)).rejects.toMatchObject({ status: 404 })
    expect((await searchStaff("management client")).clients).toEqual([])
    await as(admin)
    await assignEmployeeHouses(staff, {
      houseIds: [houseA, houseB],
      expectedUpdatedAt: await version("user", staff),
    })
    await as(staff)
    expect((await requireClient(client)).id).toBe(client)
    expect(
      await db.clientDiaryEntry.findUniqueOrThrow({
        where: { id: original.id },
      }),
    ).toMatchObject({
      clientId: client,
      houseId: houseA,
      authorId: staff,
      content: original.content,
    })
    expect(
      await db.careRecord.findUniqueOrThrow({ where: { id: care.id } }),
    ).toMatchObject({
      id: care.id,
      clientId: client,
      authorId: staff,
      templateId: template.id,
      templateVersion: 1,
      values: care.values,
    })
    expect(
      await db.clientTemplateAssignment.findUniqueOrThrow({
        where: {
          organisationId_clientId_templateId: {
            organisationId: org,
            clientId: client,
            templateId: template.id,
          },
        },
      }),
    ).toEqual(assignment)
    expect(
      (await db.clientContact.findMany({ where: { clientId: client } })).map(
        (c) => c.id,
      ),
    ).toEqual(contactsBefore)
  })
  it("rejects stale edits and leaves no extra audit on the failed concurrent save", async () => {
    await as(admin)
    const f = await houseInput(houseB),
      count = await db.auditEvent.count({ where: { organisationId: org } })
    const outcomes = await Promise.allSettled([
      editHouse(houseB, { ...f, name: "Fictional save one" }),
      editHouse(houseB, { ...f, name: "Fictional save two" }),
    ])
    expect(outcomes.filter((x) => x.status === "fulfilled")).toHaveLength(1)
    expect(outcomes.filter((x) => x.status === "rejected")).toHaveLength(1)
    expect(await db.auditEvent.count({ where: { organisationId: org } })).toBe(
      count + 1,
    )
  })
  it("role/status changes invalidate existing sessions and protect own/last Administrator", async () => {
    await as(admin)
    await expect(
      setEmployeeStatus(admin, {
        status: "INACTIVE",
        expectedUpdatedAt: await version("user", admin),
      }),
    ).rejects.toMatchObject({ status: 409 })
    const m = await db.user.findUniqueOrThrow({ where: { id: manager } })
    const oldManager = {
      user: { id: manager, sessionVersion: m.sessionVersion },
    }
    await editEmployee(manager, {
      name: m.name,
      employeeCode: m.employeeCode,
      email: m.email,
      role: "STAFF",
      status: "ACTIVE",
      houseIds: [],
      expectedUpdatedAt: m.updatedAt.toISOString(),
    })
    identity.value = oldManager
    await expect(requireManagement()).rejects.toMatchObject({ status: 401 })
    await as(admin)
    await setEmployeeStatus(staff, {
      status: "INACTIVE",
      expectedUpdatedAt: await version("user", staff),
    })
    await as(staff)
    await expect(requireEmployee()).rejects.toMatchObject({ status: 401 })
    await as(admin)
    await setEmployeeStatus(staff, {
      status: "ACTIVE",
      expectedUpdatedAt: await version("user", staff),
    })
  })
  it("rolls back assignment changes when an employee update fails uniqueness", async () => {
    await as(admin)
    const row = await db.user.findUniqueOrThrow({ where: { id: employee } })
    const before = await db.employeeHouseAssignment.findMany({
      where: { employeeId: employee, active: true },
      select: { houseId: true },
    })
    const eventCount = await db.auditEvent.count({
      where: { organisationId: org },
    })
    const owner = await db.user.findUniqueOrThrow({ where: { id: admin } })
    await expect(
      editEmployee(employee, {
        name: row.name,
        employeeCode: row.employeeCode,
        email: owner.email,
        role: row.role,
        status: row.status,
        houseIds: [houseB],
        expectedUpdatedAt: row.updatedAt.toISOString(),
      }),
    ).rejects.toMatchObject({ status: 409 })
    expect(
      await db.employeeHouseAssignment.findMany({
        where: { employeeId: employee, active: true },
        select: { houseId: true },
      }),
    ).toEqual(before)
    expect(await db.auditEvent.count({ where: { organisationId: org } })).toBe(
      eventCount,
    )
  })
  it("audit is append only and contains no credentials or personal field values", async () => {
    const events = await db.auditEvent.findMany({
      where: { organisationId: org },
    })
    expect(events.length).toBeGreaterThan(5)
    const summaries = JSON.stringify(events.map((e) => e.summary))
    expect(summaries).not.toMatch(
      /@example|000 123|Fictional relative|passwordHash|argon2|token|dateOfBirth.*2000/,
    )
    await expect(
      db.auditEvent.update({
        where: { id: events[0].id },
        data: { action: "house.updated" },
      }),
    ).rejects.toBeDefined()
    await expect(
      db.auditEvent.delete({ where: { id: events[0].id } }),
    ).rejects.toBeDefined()
  })
  it("HTTP mutations enforce same-origin JSON and safe database failures", async () => {
    const request = (body: unknown, origin = "http://localhost:8558") =>
      new Request("http://localhost:8558/api/admin/employees", {
        method: "POST",
        headers: { Origin: origin, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
    await as(admin)
    expect(
      (await postEmployee(request(emp(), "https://untrusted.example"))).status,
    ).toBe(403)
    identity.value = null
    expect((await postEmployee(request(emp()))).status).toBe(401)
    await as(staff)
    expect((await postEmployee(request(emp()))).status).toBe(403)
    await as(admin)
    const failure = vi
      .spyOn(db, "$transaction")
      .mockRejectedValueOnce(new Error("private failure"))
    try {
      const response = await postEmployee(request(emp()))
      expect(response.status).toBe(503)
      expect(await response.json()).toEqual({ error: "Service unavailable" })
    } finally {
      failure.mockRestore()
    }
    const bad = await patchHouse(
      new Request(`http://localhost:8558/api/admin/houses/${houseA}`, {
        method: "PATCH",
        headers: {
          Origin: "http://localhost:8558",
          "Content-Type": "application/json",
        },
        body: "{",
      }),
      { params: Promise.resolve({ id: houseA }) },
    )
    expect(bad.status).toBe(400)
  })
})
