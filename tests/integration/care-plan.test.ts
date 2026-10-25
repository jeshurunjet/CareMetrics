import {
  beforeAll,
  beforeEach,
  afterEach,
  afterAll,
  it,
  expect,
  vi,
} from "vitest"
import { randomUUID } from "node:crypto"
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
import {
  submitCare,
  careEditor,
  carePage,
  careRecordDetail,
} from "../../src/server/care/service"
import { careFormV1, careFormV2, careValues } from "../fixtures/care-plan"
import { POST, GET } from "../../src/app/api/clients/[id]/care-records/route"
import { GET as adminGet } from "../../src/app/api/admin/clients/[id]/care-records/route"
import { clockIn } from "../../src/server/attendance/clock-in"
import gpsFixture from "../fixtures/gps-policy.json"
import type { Prisma } from "../../src/generated/prisma/client"
const db = database(),
  originalEnv = { ...process.env }
let org: string,
  house: string,
  client: string,
  employee: string,
  template: string
async function as(id: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id } })
  identity.value = { user: { id, sessionVersion: user.sessionVersion } }
}
async function worker(
  organisationId = org,
  role: "STAFF" | "MANAGER" = "STAFF",
) {
  return db.user.create({
    data: {
      organisationId,
      name: "Fictional Care Author",
      employeeCode: randomUUID(),
      email: `care-${randomUUID()}@example.test`,
      role,
      status: "ACTIVE",
    },
  })
}
function payload(patch: Record<string, unknown> = {}) {
  return {
    requestId: randomUUID(),
    templateId: template,
    templateVersion: 1,
    values: careValues(),
    coveredAt: "2026-01-01T23:30",
    offShiftReason: "Completing fictional documentation after handover",
    ...patch,
  }
}
async function publish(version = 2) {
  return db.careTemplateVersion.create({
    data: {
      organisationId: org,
      templateId: template,
      version,
      definition: {
        ...careFormV2,
        version,
      } as unknown as Prisma.InputJsonObject,
    },
  })
}
const context = () => ({ params: Promise.resolve({ id: client }) })
async function attendance() {
  const shift = await db.shift.create({
    data: {
      organisationId: org,
      employeeId: employee,
      houseId: house,
      startsAt: new Date(Date.now() - 300000),
      endsAt: new Date(Date.now() + 3600000),
    },
  })
  process.env.CAREMETRICS_GPS_TEST_POLICY_ACK = "fictional-development-only"
  process.env.CAREMETRICS_GPS_POLICIES = JSON.stringify([
    {
      ...gpsFixture,
      organisationId: org,
      houses: [{ id: house, latitude: -36.85, longitude: 174.76 }],
    },
  ])
  await clockIn({
    shiftId: shift.id,
    requestId: randomUUID(),
    latitude: -36.85,
    longitude: 174.76,
    accuracyMetres: 5,
    measuredAt: Date.now() - 100,
  })
}
beforeAll(() => {
  if (process.env.NEON_BRANCH_NAME !== "local-test")
    throw new Error("Care destructive tests require disposable local-test")
})
beforeEach(async () => {
  org = (
    await db.organisation.create({
      data: { name: `Fictional Care ${randomUUID()}` },
    })
  ).id
  house = (
    await db.house.create({
      data: {
        organisationId: org,
        code: "CARE",
        name: "Fictional Care House",
        address: "Fictional only",
        latitude: -36.85,
        longitude: 174.76,
      },
    })
  ).id
  client = (
    await db.client.create({
      data: {
        organisationId: org,
        houseId: house,
        reference: "C1",
        name: "Fictional Care Client",
      },
    })
  ).id
  employee = (await worker()).id
  await db.employeeHouseAssignment.create({
    data: { organisationId: org, employeeId: employee, houseId: house },
  })
  template = (
    await db.careTemplate.create({
      data: { organisationId: org, name: "Fictional support review" },
    })
  ).id
  await db.careTemplateVersion.create({
    data: {
      organisationId: org,
      templateId: template,
      version: 1,
      definition: careFormV1 as unknown as Prisma.InputJsonObject,
    },
  })
  await db.clientTemplateAssignment.create({
    data: {
      organisationId: org,
      clientId: client,
      templateId: template,
      version: 1,
    },
  })
  await as(employee)
})
afterEach(() => {
  vi.restoreAllMocks()
  process.env = { ...originalEnv }
  identity.value = null
})
afterAll(async () => {
  await db.$disconnect()
})
it.each(["NODE_ENV", "VERCEL_ENV"])(
  "test attendance never waives a production documentation reason via %s",
  async (key) => {
    await attendance()
    process.env[key] = "production"
    process.env.AUTH_URL = "https://fictional-evaluation.example.test"
    await expect(
      submitCare(client, payload({ offShiftReason: "" })),
    ).rejects.toMatchObject({ status: 400 })
    const saved = await submitCare(client, payload())
    expect(
      (await db.careRecord.findUniqueOrThrow({ where: { id: saved.id } }))
        .documentationContext,
    ).toMatchObject({ offShift: true, attendanceId: null })
  },
)
it("keeps an older assigned version usable outside the bounded latest-version metadata list", async () => {
  await db.careTemplateVersion.createMany({
    data: Array.from({ length: 101 }, (_, i) => ({
      organisationId: org,
      templateId: template,
      version: i + 2,
      definition: {
        ...careFormV2,
        version: i + 2,
      } as unknown as Prisma.InputJsonObject,
    })),
  })
  expect((await carePage(client)).categories[0].available).toBe(true)
  await as((await worker(org, "MANAGER")).id)
  const data = await carePage(client, { sub: template, version: "1" }, true)
  expect(data.publishedForm).toEqual(careFormV1)
  expect(data.selected?.publishedVersions).toHaveLength(100)
})
it("a malformed newly assigned version never prevents authorised reading of a valid historical version", async () => {
  const saved = await submitCare(client, payload())
  await db.careTemplateVersion.create({
    data: {
      organisationId: org,
      templateId: template,
      version: 2,
      definition: { version: 2, published: true, sections: [] },
    },
  })
  await db.clientTemplateAssignment.updateMany({
    where: { clientId: client },
    data: { version: 2 },
  })
  await as((await worker(org, "MANAGER")).id)
  expect(
    (await carePage(client, { sub: template, item: saved.id }, true)).detail
      ?.form,
  ).toEqual(careFormV1)
  expect(
    (await carePage(client, { sub: template }, true)).rows[0].form,
  ).toEqual(careFormV1)
  await expect(
    carePage(client, { sub: template, version: "2" }, true),
  ).rejects.toMatchObject({ status: 503 })
})
it("returns a safe integrity failure for malformed retained answers rather than substituting another version", async () => {
  const row = await db.careRecord.create({
    data: {
      organisationId: org,
      clientId: client,
      authorId: employee,
      templateId: template,
      templateVersion: 1,
      values: { unknown: "Fictional legacy value" },
      coveredAt: new Date("2026-01-01T00:00:00Z"),
      submittedAt: new Date(),
      status: "SUBMITTED",
    },
  })
  await publish()
  await expect(careRecordDetail(client, row.id)).rejects.toMatchObject({
    status: 503,
  })
})
it.each([
  {},
  { ruleVersion: "recorded-current-house-v1" },
  { ruleVersion: "recorded-current-house-v1", offShift: false },
])(
  "database rejects incomplete new care context %j",
  async (documentationContext) => {
    const saved = await submitCare(client, payload()),
      row = await db.careRecord.findUniqueOrThrow({ where: { id: saved.id } })
    await expect(
      db.careRecord.create({
        data: {
          ...row,
          values: row.values as Prisma.InputJsonObject,
          id: randomUUID(),
          requestId: randomUUID(),
          documentationContext,
        },
      }),
    ).rejects.toThrow()
  },
)
it("submits the assigned exact version with trusted author/time, stable rows and minimal transactional audit", async () => {
  const start = Date.now(),
    saved = await submitCare(client, payload()),
    end = Date.now(),
    row = await db.careRecord.findUniqueOrThrow({ where: { id: saved.id } })
  expect(row).toMatchObject({
    organisationId: org,
    clientId: client,
    houseId: house,
    authorId: employee,
    templateId: template,
    templateVersion: 1,
    status: "SUBMITTED",
  })
  expect(row.submittedAt!.getTime()).toBeGreaterThanOrEqual(start)
  expect(row.submittedAt!.getTime()).toBeLessThanOrEqual(end)
  expect(row.documentationContext).toMatchObject({ offShift: true })
  expect(row.values).toMatchObject({
    items: careValues().items,
    eventAt: "2026-01-01T10:30:00.000Z",
  })
  const events = await db.auditEvent.findMany({ where: { targetId: saved.id } })
  expect(events).toHaveLength(1)
  expect(events[0]).toMatchObject({
    organisationId: org,
    actorId: employee,
    action: "care.submitted",
    targetType: "careRecord",
  })
  expect(JSON.stringify(events[0].summary)).not.toMatch(
    /Fictional respectful|offShiftReason|values|notes|requestDigest/,
  )
  await as(employee)
  expect((await careRecordDetail(client, saved.id)).form).toEqual(careFormV1)
  expect(JSON.stringify(await careRecordDetail(client, saved.id))).not.toMatch(
    /requestDigest|documentationContext|passwordHash|latitude|longitude/,
  )
})
it("does not reinterpret v1 labels/options/columns after a new version and assignment, and blocks stale new submissions", async () => {
  const input = payload(),
    saved = await submitCare(client, input),
    old = await db.careRecord.findUniqueOrThrow({ where: { id: saved.id } })
  await publish()
  await db.clientTemplateAssignment.updateMany({
    where: { clientId: client },
    data: { version: 2 },
  })
  const detail = await careRecordDetail(client, saved.id)
  expect(detail.templateVersion).toBe(1)
  expect(detail.form.sections[0].fields[0].label).toBe("Original observations")
  expect(detail.form).toEqual(careFormV1)
  expect((await careEditor(client, template)).form).toEqual(careFormV2)
  expect(await submitCare(client, input)).toEqual({
    id: saved.id,
    replayed: true,
  })
  await expect(submitCare(client, payload())).rejects.toMatchObject({
    status: 409,
  })
  const next = await submitCare(client, payload({ templateVersion: 2 }))
  expect((await careRecordDetail(client, next.id)).form).toEqual(careFormV2)
  expect(await db.careRecord.findUnique({ where: { id: saved.id } })).toEqual(
    old,
  )
})
it.each([
  "values",
  "authorId",
  "clientId",
  "templateVersion",
  "submittedAt",
  "coveredAt",
  "status",
  "requestDigest",
  "houseId",
])("rejects submitted %s rewrites and deletion", async (key) => {
  const saved = await submitCare(client, payload()),
    row = await db.careRecord.findUniqueOrThrow({ where: { id: saved.id } })
  const changes: Record<string, unknown> = {
    values: { notes: "replacement" },
    authorId: (await worker()).id,
    clientId: randomUUID(),
    templateVersion: 2,
    submittedAt: new Date(),
    coveredAt: new Date(),
    status: "DRAFT",
    requestDigest: "a".repeat(64),
    houseId: randomUUID(),
  }
  await expect(
    db.careRecord.update({
      where: { id: saved.id },
      data: { [key]: changes[key] },
    }),
  ).rejects.toThrow()
  await expect(
    db.careRecord.delete({ where: { id: saved.id } }),
  ).rejects.toThrow()
  expect(await db.careRecord.findUnique({ where: { id: saved.id } })).toEqual(
    row,
  )
})
it("published definitions cannot be edited or deleted", async () => {
  const v = await db.careTemplateVersion.findFirstOrThrow({
    where: { templateId: template },
  })
  await expect(
    db.careTemplateVersion.update({
      where: { id: v.id },
      data: { definition: {} },
    }),
  ).rejects.toThrow()
  await expect(
    db.careTemplateVersion.delete({ where: { id: v.id } }),
  ).rejects.toThrow()
})
it.each([
  "paused",
  "unassigned",
  "archived",
  "chart",
  "wrong-client",
  "wrong-tenant",
  "unknown",
])("blocks %s template selection and new writes", async (mode) => {
  let id = template
  if (mode === "paused")
    await db.clientTemplateAssignment.updateMany({
      where: { clientId: client },
      data: { active: false },
    })
  if (mode === "unassigned")
    await db.clientTemplateAssignment.deleteMany({
      where: { clientId: client },
    })
  if (mode === "archived")
    await db.careTemplate.update({
      where: { id: template },
      data: { archived: true },
    })
  if (mode === "chart")
    await db.careTemplate.update({
      where: { id: template },
      data: { kind: "CHART" },
    })
  if (mode === "wrong-client") {
    const other = await db.client.create({
      data: {
        organisationId: org,
        houseId: house,
        reference: "C2",
        name: "Other fictional client",
      },
    })
    client = other.id
  }
  if (mode === "wrong-tenant") {
    const foreign = await db.organisation.create({
      data: { name: "Other fictional tenant" },
    })
    id = (
      await db.careTemplate.create({
        data: { organisationId: foreign.id, name: "Other fictional template" },
      })
    ).id
  }
  if (mode === "unknown") id = randomUUID()
  await expect(careEditor(client, id)).rejects.toMatchObject({ status: 404 })
  await expect(
    submitCare(client, payload({ templateId: id })),
  ).rejects.toMatchObject({ status: 404 })
})
it.each([false, "unsupported", "invalid", "wrong-version"])(
  "fails closed on invalid published definition %s",
  async (mode) => {
    const id = (
      await db.careTemplate.create({
        data: { organisationId: org, name: "Fictional invalid" },
      })
    ).id
    const definition =
      mode === false
        ? { ...careFormV1, published: false }
        : mode === "unsupported"
          ? {
              version: 1,
              published: true,
              sections: [
                {
                  id: "s",
                  title: "s",
                  fields: [
                    {
                      id: "photo",
                      type: "photo",
                      label: "Photo",
                      unsupported: true,
                    },
                  ],
                },
              ],
            }
          : mode === "wrong-version"
            ? { ...careFormV1, version: 2 }
            : { version: 1, published: true, sections: [] }
    await db.careTemplateVersion.create({
      data: {
        organisationId: org,
        templateId: id,
        version: 1,
        definition: definition as unknown as Prisma.InputJsonObject,
      },
    })
    await db.clientTemplateAssignment.create({
      data: {
        organisationId: org,
        clientId: client,
        templateId: id,
        version: 1,
      },
    })
    await expect(careEditor(client, id)).rejects.toMatchObject({ status: 503 })
    await expect(
      submitCare(client, payload({ templateId: id })),
    ).rejects.toMatchObject({ status: 503 })
    expect(
      (await carePage(client)).categories.find((c) => c.id === id)?.available,
    ).toBe(false)
  },
)
it("retains history when assignments pause or template archives; exact replay is an authorised historical read", async () => {
  const p = payload(),
    saved = await submitCare(client, p)
  await db.clientTemplateAssignment.updateMany({
    where: { clientId: client },
    data: { active: false },
  })
  await db.careTemplate.update({
    where: { id: template },
    data: { archived: true },
  })
  expect((await carePage(client, { sub: template })).rows[0].id).toBe(saved.id)
  expect(await submitCare(client, p)).toEqual({ id: saved.id, replayed: true })
})
it("requires off-shift reason and reuses actual qualifying attendance, rechecking the scheduled end", async () => {
  await expect(
    submitCare(client, payload({ offShiftReason: "" })),
  ).rejects.toMatchObject({ status: 400 })
  await attendance()
  expect((await careEditor(client, template)).offShift).toBe(false)
  const saved = await submitCare(client, payload({ offShiftReason: "" }))
  expect(
    (await db.careRecord.findUniqueOrThrow({ where: { id: saved.id } }))
      .documentationContext,
  ).toMatchObject({ offShift: false, attendanceId: expect.any(String) })
  vi.spyOn(Date, "now").mockReturnValue(Date.now() + 7200000)
  await expect(
    submitCare(client, payload({ offShiftReason: "" })),
  ).rejects.toMatchObject({ status: 400 })
})
it("unrelated-house or other-employee attendance does not qualify", async () => {
  await attendance()
  const next = await worker()
  await db.employeeHouseAssignment.create({
    data: { organisationId: org, employeeId: next.id, houseId: house },
  })
  await as(next.id)
  await expect(
    submitCare(client, payload({ offShiftReason: "" })),
  ).rejects.toMatchObject({ status: 400 })
  await as(employee)
  const h = await db.house.create({
    data: {
      organisationId: org,
      code: "OTHER",
      name: "Other fictional house",
      address: "Fictional",
    },
  })
  await db.employeeHouseAssignment.create({
    data: { organisationId: org, employeeId: employee, houseId: h.id },
  })
  await db.client.update({ where: { id: client }, data: { houseId: h.id } })
  await expect(
    submitCare(client, payload({ offShiftReason: "" })),
  ).rejects.toMatchObject({ status: 400 })
})
it.each([
  { values: { ...careValues(), notes: "" } },
  { values: { ...careValues(), support: "bad" } },
  { values: { ...careValues(), support: "follow-up" } },
  { values: { ...careValues(), followUp: "hidden" } },
  { values: { ...careValues(), count: 11 } },
  { values: { ...careValues(), rating: 6 } },
  { values: { ...careValues(), unknown: "value" } },
  {
    values: {
      ...careValues(),
      items: [
        { id: "a", values: { item: "x", quantity: 20, state: "checked" } },
      ],
    },
  },
  {
    values: {
      ...careValues(),
      items: [
        {
          id: "a",
          values: { item: "x", quantity: 1, state: "checked", unknown: "cell" },
        },
      ],
    },
  },
  {
    values: {
      ...careValues(),
      items: [
        { id: "a", values: {} },
        { id: "a", values: {} },
      ],
    },
  },
  { coveredAt: "2026-04-05T02:30" },
  { coveredAt: "2026-09-27T02:30" },
  { coveredAt: "2099-01-01T12:00" },
  { authorId: "forged" },
  { organisationId: "forged" },
  { isOnShift: true },
  { status: "DRAFT" },
  { templateVersion: 0 },
])(
  "rejects malformed or forged submission %# without success audit",
  async (patch) => {
    await expect(submitCare(client, payload(patch))).rejects.toMatchObject({
      status: 400,
    })
    expect(await db.careRecord.count({ where: { clientId: client } })).toBe(0)
    expect(await db.auditEvent.count({ where: { organisationId: org } })).toBe(
      0,
    )
  },
)
it.each(["inactive", "revoked", "anonymous", "inactive-org"])(
  "denies %s identities",
  async (mode) => {
    if (mode === "inactive")
      await db.user.update({
        where: { id: employee },
        data: { status: "INACTIVE" },
      })
    if (mode === "revoked")
      await db.user.update({
        where: { id: employee },
        data: { sessionVersion: { increment: 1 } },
      })
    if (mode === "anonymous") identity.value = null
    if (mode === "inactive-org")
      await db.organisation.update({
        where: { id: org },
        data: { active: false },
      })
    await expect(carePage(client)).rejects.toMatchObject({ status: 401 })
    await expect(submitCare(client, payload())).rejects.toMatchObject({
      status: 401,
    })
  },
)
it.each(["unassigned", "inactive-client", "inactive-house", "cross-tenant"])(
  "denies %s client scope on reads and writes",
  async (mode) => {
    if (mode === "unassigned")
      await db.employeeHouseAssignment.updateMany({
        where: { employeeId: employee },
        data: { active: false },
      })
    if (mode === "inactive-client")
      await db.client.update({ where: { id: client }, data: { active: false } })
    if (mode === "inactive-house")
      await db.house.update({ where: { id: house }, data: { active: false } })
    if (mode === "cross-tenant") {
      const foreign = await db.organisation.create({
        data: { name: "Foreign fictional org" },
      })
      await as((await worker(foreign.id, "MANAGER")).id)
    }
    await expect(carePage(client)).rejects.toMatchObject({ status: 404 })
    await expect(submitCare(client, payload())).rejects.toMatchObject({
      status: 404,
    })
  },
)
it("management reads are capability-scoped, client-specific and never expose other-client records", async () => {
  const saved = await submitCare(client, payload()),
    other = await db.client.create({
      data: {
        organisationId: org,
        houseId: house,
        reference: "C2",
        name: "Other fictional",
      },
    })
  await expect(careRecordDetail(other.id, saved.id)).rejects.toMatchObject({
    status: 404,
  })
  await expect(carePage(client, {}, true)).rejects.toMatchObject({
    status: 403,
  })
  await as((await worker(org, "MANAGER")).id)
  expect(
    (await carePage(client, { sub: template, item: saved.id }, true)).detail
      ?.id,
  ).toBe(saved.id)
  expect(
    (await carePage(client, { sub: template, version: "1" }, true))
      .publishedForm,
  ).toEqual(careFormV1)
})
it("preserves original house/answers after transfer and follows only current client access", async () => {
  const saved = await submitCare(client, payload()),
    old = await db.careRecord.findUniqueOrThrow({ where: { id: saved.id } }),
    nextHouse = await db.house.create({
      data: {
        organisationId: org,
        code: "DEST",
        name: "Fictional destination",
        address: "Fictional",
      },
    }),
    next = await worker()
  await db.employeeHouseAssignment.create({
    data: { organisationId: org, employeeId: next.id, houseId: nextHouse.id },
  })
  await db.client.update({
    where: { id: client },
    data: { houseId: nextHouse.id },
  })
  await expect(careRecordDetail(client, saved.id)).rejects.toMatchObject({
    status: 404,
  })
  await as(next.id)
  expect((await careRecordDetail(client, saved.id)).houseId).toBe(house)
  expect(await db.careRecord.findUnique({ where: { id: saved.id } })).toEqual(
    old,
  )
})
it("orders and paginates deterministic history without substituting the assigned/latest version", async () => {
  for (let i = 0; i < 8; i++) await submitCare(client, payload())
  const first = await carePage(client, { sub: template }),
    second = await carePage(client, { sub: template, page: "2" })
  expect(first.rows).toHaveLength(6)
  expect(second.rows).toHaveLength(2)
  expect(new Set([...first.rows, ...second.rows].map((r) => r.id)).size).toBe(8)
  expect(first.rows.map((r) => r.submittedAt + r.id)).toEqual(
    first.rows
      .map((r) => r.submittedAt + r.id)
      .sort()
      .reverse(),
  )
  expect(
    (
      await carePage(client, {
        sub: template,
        page: "2",
        item: first.rows[0].id,
      })
    ).detail?.id,
  ).toBe(first.rows[0].id)
})
it("same concurrent request creates one original/audit, allows object-key reordering, rejects changed payload", async () => {
  const p = payload(),
    results = await Promise.all([submitCare(client, p), submitCare(client, p)])
  expect(results[0].id).toBe(results[1].id)
  expect(results.filter((r) => r.replayed)).toHaveLength(1)
  expect(await db.careRecord.count({ where: { clientId: client } })).toBe(1)
  expect(
    await db.auditEvent.count({ where: { targetId: results[0].id } }),
  ).toBe(1)
  expect(
    (
      await submitCare(client, {
        ...p,
        values: Object.fromEntries(Object.entries(careValues()).reverse()),
      })
    ).id,
  ).toBe(results[0].id)
  await expect(
    submitCare(client, {
      ...p,
      values: { ...careValues(), notes: "Changed fictional observation" },
    }),
  ).rejects.toMatchObject({ status: 409 })
})
it("rolls back the record if its audit cannot commit", async () => {
  await db.$executeRawUnsafe(
    `CREATE FUNCTION cm2h_fail_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."actorId"='${employee}'::uuid AND NEW.action='care.submitted' THEN RAISE EXCEPTION 'fictional audit rollback'; END IF; RETURN NEW; END; $$`,
  )
  await db.$executeRawUnsafe(
    'CREATE TRIGGER cm2h_fail_audit BEFORE INSERT ON "AuditEvent" FOR EACH ROW EXECUTE FUNCTION cm2h_fail_audit()',
  )
  try {
    await expect(submitCare(client, payload())).rejects.toThrow()
    expect(await db.careRecord.count({ where: { clientId: client } })).toBe(0)
    expect(await db.auditEvent.count({ where: { organisationId: org } })).toBe(
      0,
    )
  } finally {
    await db.$executeRawUnsafe('DROP TRIGGER cm2h_fail_audit ON "AuditEvent"')
    await db.$executeRawUnsafe("DROP FUNCTION cm2h_fail_audit()")
  }
})
it("rejects malformed/duplicate/origin HTTP input and returns safe service failures without mock fallback", async () => {
  const make = (body: string, origin = "http://localhost:8558") =>
    new Request(`http://localhost:8558/api/clients/${client}/care-records`, {
      method: "POST",
      headers: { Origin: origin, "Content-Type": "application/json" },
      body,
    })
  expect(
    (
      await POST(
        make(JSON.stringify(payload()), "https://untrusted.example"),
        context(),
      )
    ).status,
  ).toBe(403)
  const raw = JSON.stringify(payload()).replace(
    '"notes":',
    '"notes":"duplicate", "notes":',
  )
  expect((await POST(make(raw), context())).status).toBe(400)
  expect(
    (
      await GET(
        new Request(
          `http://localhost:8558/api/clients/${client}/care-records?sub=${template}&page=1&page=2`,
        ),
        context(),
      )
    ).status,
  ).toBe(400)
  expect(
    (
      await adminGet(
        new Request(
          `http://localhost:8558/api/admin/clients/${client}/care-records`,
        ),
        context(),
      )
    ).status,
  ).toBe(403)
  vi.spyOn(db.careRecord, "findMany").mockRejectedValueOnce(
    new Error("private failure"),
  )
  const response = await GET(
    new Request(
      `http://localhost:8558/api/clients/${client}/care-records?sub=${template}`,
    ),
    context(),
  )
  expect(response.status).toBe(503)
  expect(await response.text()).not.toMatch(/private|answers|Fictional/)
})
it.each([
  { sub: "bad" },
  { item: "bad" },
  { page: "0" },
  { page: "100001" },
  { sub: [], page: "1" },
  { version: "1" },
  { action: "correction" },
  { q: "sensitive care text" },
  { range: "365" },
])("rejects invalid filters %j", async (query) => {
  await expect(carePage(client, query)).rejects.toMatchObject({ status: 400 })
})
