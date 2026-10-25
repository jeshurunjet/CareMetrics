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
import {
  submitDiary,
  diaryHistory,
  diaryEditor,
} from "../../src/server/diary/service"
import { clockIn } from "../../src/server/attendance/clock-in"
import gpsFixture from "../fixtures/gps-policy.json"
import { GET, POST } from "../../src/app/api/clients/[id]/diary/route"
import { GET as adminGET } from "../../src/app/api/admin/clients/[id]/diary/route"
const db = database(),
  savedEnv = { ...process.env }
let org: string, house: string, client: string, employee: string
async function as(id: string) {
  const row = await db.user.findUniqueOrThrow({ where: { id } })
  identity.value = { user: { id, sessionVersion: row.sessionVersion } }
}
async function worker(
  organisationId = org,
  role: "STAFF" | "MANAGER" = "STAFF",
) {
  return db.user.create({
    data: {
      organisationId,
      name: "Fictional Diary Author",
      employeeCode: randomUUID(),
      email: `diary-${randomUUID()}@example.test`,
      role,
      status: "ACTIVE",
    },
  })
}
function input(patch: Record<string, unknown> = {}) {
  return {
    requestId: randomUUID(),
    title: "Fictional routine",
    categoryKey: "progress-notes",
    content: "Fictional respectful observation; no actual care information.",
    coveredAt: "2026-01-01T23:30",
    offShiftReason: "Completing fictional handover",
    ...patch,
  }
}
const context = () => ({ params: Promise.resolve({ id: client }) })
function request(body: unknown, origin = "http://localhost:8558") {
  return new Request(`http://localhost:8558/api/clients/${client}/diary`, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}
async function recorded(patch: Record<string, unknown> = {}) {
  const shift = await db.shift.create({
    data: {
      organisationId: org,
      employeeId: employee,
      houseId: house,
      startsAt: new Date(Date.now() - 300000),
      endsAt: new Date(Date.now() + 3600000),
      ...patch,
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
  return shift
}
beforeAll(() => {
  if (process.env.NEON_BRANCH_NAME !== "local-test")
    throw new Error("Diary destructive checks require disposable local-test")
})
beforeEach(async () => {
  org = (
    await db.organisation.create({
      data: { name: `Fictional Diary ${randomUUID()}` },
    })
  ).id
  house = (
    await db.house.create({
      data: {
        organisationId: org,
        code: "DIARY",
        name: "Fictional Original House",
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
        reference: "D1",
        name: "Fictional Diary Client",
      },
    })
  ).id
  employee = (await worker()).id
  await db.employeeHouseAssignment.create({
    data: { organisationId: org, employeeId: employee, houseId: house },
  })
  await as(employee)
})
afterEach(() => {
  vi.restoreAllMocks()
  process.env = { ...savedEnv }
  identity.value = null
})
afterAll(async () => {
  await db.$disconnect()
})
it("commits an attributed immutable off-shift original and minimal audit; fresh session reloads it", async () => {
  const before = Date.now(),
    p = input(),
    saved = await submitDiary(client, p),
    after = Date.now()
  const row = await db.clientDiaryEntry.findUniqueOrThrow({
    where: { id: saved.id },
  })
  expect(row.authorId).toBe(employee)
  expect(row.organisationId).toBe(org)
  expect(row.houseId).toBe(house)
  expect(row.status).toBe("SUBMITTED")
  expect(row.submittedAt!.getTime()).toBeGreaterThanOrEqual(before)
  expect(row.submittedAt!.getTime()).toBeLessThanOrEqual(after)
  expect(row.coveredAt.toISOString()).toBe("2026-01-01T10:30:00.000Z")
  expect(row.documentationContext).toMatchObject({ offShift: true })
  const audit = await db.auditEvent.findMany({ where: { targetId: saved.id } })
  expect(audit).toHaveLength(1)
  expect(audit[0]).toMatchObject({
    action: "diary.submitted",
    actorId: employee,
    organisationId: org,
  })
  expect(JSON.stringify(audit[0].summary)).not.toContain(p.content)
  expect(JSON.stringify(audit[0].summary)).not.toContain(p.offShiftReason)
  await as(employee)
  const detail = (await diaryHistory(client, { item: row.id })).detail!
  expect(detail.content).toBe(p.content)
  expect(detail.authorName).toBe("Fictional Diary Author")
  expect(JSON.stringify(detail)).not.toMatch(
    /requestDigest|documentationContext|password|latitude|longitude/,
  )
})
it.each([
  "content",
  "authorId",
  "clientId",
  "category",
  "coveredAt",
  "submittedAt",
  "status",
  "requestDigest",
  "houseId",
])("rejects changing submitted %s and rejects deletion", async (key) => {
  const saved = await submitDiary(client, input()),
    row = await db.clientDiaryEntry.findUniqueOrThrow({
      where: { id: saved.id },
    })
  const changes: Record<string, unknown> = {
    content: "replacement",
    authorId: (await worker()).id,
    clientId: randomUUID(),
    category: "changed",
    coveredAt: new Date(),
    submittedAt: new Date(),
    status: "DRAFT",
    requestDigest: "a".repeat(64),
    houseId: randomUUID(),
  }
  await expect(
    db.clientDiaryEntry.update({
      where: { id: saved.id },
      data: { [key]: changes[key] },
    }),
  ).rejects.toThrow()
  await expect(
    db.clientDiaryEntry.delete({ where: { id: saved.id } }),
  ).rejects.toThrow()
  expect(
    await db.clientDiaryEntry.findUnique({ where: { id: saved.id } }),
  ).toEqual(row)
})
it("requires a reason without attendance and ignores a scheduled shift alone", async () => {
  await db.shift.create({
    data: {
      organisationId: org,
      employeeId: employee,
      houseId: house,
      startsAt: new Date(Date.now() - 3600000),
      endsAt: new Date(Date.now() + 3600000),
    },
  })
  expect((await diaryEditor(client)).offShift).toBe(true)
  await expect(
    submitDiary(client, input({ offShiftReason: "" })),
  ).rejects.toMatchObject({
    status: 400,
    fields: { offShiftReason: expect.any(String) },
  })
  expect(await db.clientDiaryEntry.count({ where: { clientId: client } })).toBe(
    0,
  )
})
it("uses actual eligible attendance for the current house and rechecks at commit", async () => {
  const shift = await recorded()
  expect((await diaryEditor(client)).offShift).toBe(false)
  const saved = await submitDiary(client, input({ offShiftReason: "" }))
  expect(
    (await db.clientDiaryEntry.findUniqueOrThrow({ where: { id: saved.id } }))
      .documentationContext,
  ).toMatchObject({ offShift: false, attendanceId: expect.any(String) })
  const future = Date.now() + 7200000
  vi.spyOn(Date, "now").mockReturnValue(future)
  await expect(
    submitDiary(client, input({ offShiftReason: "" })),
  ).rejects.toMatchObject({ status: 400 })
  expect(
    (
      await db.shift.findUniqueOrThrow({ where: { id: shift.id } })
    ).endsAt.getTime(),
  ).toBeLessThan(future)
})
it("unrelated house attendance does not establish eligibility", async () => {
  await recorded()
  const other = await db.house.create({
    data: {
      organisationId: org,
      code: "OTHER",
      name: "Other fictional house",
      address: "Fictional",
    },
  })
  await db.employeeHouseAssignment.create({
    data: { organisationId: org, employeeId: employee, houseId: other.id },
  })
  await db.client.update({ where: { id: client }, data: { houseId: other.id } })
  expect((await diaryEditor(client)).offShift).toBe(true)
  await expect(
    submitDiary(client, input({ offShiftReason: "" })),
  ).rejects.toMatchObject({ status: 400 })
})
it("another employee's actual attendance never establishes on-shift authority", async () => {
  await recorded()
  const second = await worker()
  await db.employeeHouseAssignment.create({
    data: { organisationId: org, employeeId: second.id, houseId: house },
  })
  await as(second.id)
  await expect(
    submitDiary(client, input({ offShiftReason: "" })),
  ).rejects.toMatchObject({ status: 400 })
})
it.each(["closed", "cancelled", "unverified"])(
  "%s attendance cannot supply current eligibility",
  async (mode) => {
    if (mode === "unverified") {
      const shift = await db.shift.create({
        data: {
          organisationId: org,
          employeeId: employee,
          houseId: house,
          startsAt: new Date(Date.now() - 3600000),
          endsAt: new Date(Date.now() + 3600000),
        },
      })
      await db.attendanceRecord.create({
        data: {
          organisationId: org,
          employeeId: employee,
          shiftId: shift.id,
          clockIn: new Date(Date.now() - 3600000),
        },
      })
    } else {
      const shift = await recorded()
      if (mode === "cancelled")
        await db.shift.update({
          where: { id: shift.id },
          data: { status: "CANCELLED" },
        })
      else {
        process.env.CAREMETRICS_CLOCK_OUT_TEST_POLICY_ACK =
          "fictional-development-only"
        process.env.CAREMETRICS_CLOCK_OUT_POLICIES = JSON.stringify([
          {
            organisationId: org,
            approval: "test-only",
            enabled: true,
            version: "test-diary-closure",
            mode: "NO_LOCATION_REQUIRED",
          },
        ])
        const attendance = await db.attendanceRecord.findUniqueOrThrow({
          where: { shiftId: shift.id },
        })
        const { clockOut } = await import(
          "../../src/server/attendance/clock-out"
        )
        await clockOut({ attendanceId: attendance.id, requestId: randomUUID() })
      }
    }
    await expect(
      submitDiary(client, input({ offShiftReason: "" })),
    ).rejects.toMatchObject({ status: 400 })
  },
)
it.each([
  { categoryKey: "bad" },
  { title: "" },
  { content: "" },
  { content: "x".repeat(10001) },
  { coveredAt: "2026-04-05T02:30" },
  { coveredAt: "2026-09-27T02:30" },
  { coveredAt: "2099-01-01T01:00" },
  { authorId: "forged" },
  { isOnShift: true },
  { status: "DRAFT" },
  { attachments: ["fake"] },
])("rejects invalid or forged submission without audit %j", async (patch) => {
  await expect(submitDiary(client, input(patch))).rejects.toMatchObject({
    status: 400,
  })
  expect(await db.clientDiaryEntry.count({ where: { clientId: client } })).toBe(
    0,
  )
  expect(await db.auditEvent.count({ where: { organisationId: org } })).toBe(0)
})
it.each([
  "inactive-client",
  "inactive-house",
  "removed-assignment",
  "unknown-client",
])("denies %s for history and submission", async (mode) => {
  if (mode === "inactive-client")
    await db.client.update({ where: { id: client }, data: { active: false } })
  if (mode === "inactive-house")
    await db.house.update({ where: { id: house }, data: { active: false } })
  if (mode === "removed-assignment")
    await db.employeeHouseAssignment.updateMany({
      where: { employeeId: employee },
      data: { active: false },
    })
  if (mode === "unknown-client") client = randomUUID()
  await expect(submitDiary(client, input())).rejects.toMatchObject({
    status: 404,
  })
  await expect(diaryHistory(client)).rejects.toMatchObject({ status: 404 })
})
it("denies unassigned and cross-tenant actors even if they know the record ID; management is tenant-scoped", async () => {
  const saved = await submitDiary(client, input()),
    unrelated = await worker()
  await as(unrelated.id)
  await expect(diaryHistory(client, { item: saved.id })).rejects.toMatchObject({
    status: 404,
  })
  await expect(submitDiary(client, input())).rejects.toMatchObject({
    status: 404,
  })
  await expect(diaryHistory(client, {}, true)).rejects.toMatchObject({
    status: 403,
  })
  const foreign = await db.organisation.create({
    data: { name: "Fictional other tenant" },
  })
  await as((await worker(foreign.id, "MANAGER")).id)
  await expect(
    diaryHistory(client, { item: saved.id }, true),
  ).rejects.toMatchObject({ status: 404 })
  await as((await worker(org, "MANAGER")).id)
  expect(
    (await diaryHistory(client, { item: saved.id }, true)).detail?.id,
  ).toBe(saved.id)
})
it.each(["revoked", "inactive", "inactive-organisation", "anonymous"])(
  "denies %s sessions",
  async (mode) => {
    if (mode === "revoked")
      await db.user.update({
        where: { id: employee },
        data: { sessionVersion: { increment: 1 } },
      })
    if (mode === "inactive")
      await db.user.update({
        where: { id: employee },
        data: { status: "INACTIVE" },
      })
    if (mode === "inactive-organisation")
      await db.organisation.update({
        where: { id: org },
        data: { active: false },
      })
    if (mode === "anonymous") identity.value = null
    await expect(submitDiary(client, input())).rejects.toMatchObject({
      status: 401,
    })
    await expect(diaryHistory(client)).rejects.toMatchObject({ status: 401 })
  },
)
it("transfers change current history access but preserve original house and content", async () => {
  const saved = await submitDiary(client, input()),
    destination = await db.house.create({
      data: {
        organisationId: org,
        code: "DEST",
        name: "Fictional destination",
        address: "Fictional",
      },
    }),
    next = await worker()
  await db.employeeHouseAssignment.create({
    data: { organisationId: org, employeeId: next.id, houseId: destination.id },
  })
  await db.client.update({
    where: { id: client },
    data: { houseId: destination.id },
  })
  await expect(diaryHistory(client, { item: saved.id })).rejects.toMatchObject({
    status: 404,
  })
  await as(next.id)
  expect((await diaryHistory(client, { item: saved.id })).detail).toMatchObject(
    { houseId: house, authorId: employee },
  )
})
it("orders deterministic bounded history, retains independent detail scope and rejects other-client IDs", async () => {
  const saved = []
  for (let i = 0; i < 8; i++) saved.push(await submitDiary(client, input()))
  const one = await diaryHistory(client),
    two = await diaryHistory(client, { page: "2" })
  expect(one.rows).toHaveLength(6)
  expect(two.rows).toHaveLength(2)
  expect(new Set([...one.rows, ...two.rows].map((r) => r.id)).size).toBe(8)
  expect(one.rows.map((r) => [r.submittedAt, r.id].join())).toEqual(
    one.rows
      .map((r) => [r.submittedAt, r.id].join())
      .sort()
      .reverse(),
  )
  expect(
    (await diaryHistory(client, { page: "2", item: saved[7].id })).detail?.id,
  ).toBe(saved[7].id)
  const other = await db.client.create({
    data: {
      organisationId: org,
      houseId: house,
      reference: "D2",
      name: "Fictional other client",
    },
  })
  await expect(
    diaryHistory(other.id, { item: saved[0].id }),
  ).rejects.toMatchObject({ status: 404 })
  await expect(
    diaryHistory(client, { item: randomUUID() }),
  ).rejects.toMatchObject({ status: 404 })
})
it.each([
  { page: "0" },
  { page: "100001" },
  { page: ["1"] },
  { category: "bad" },
  { range: "365" },
  { item: "bad" },
  { authorId: "forged" },
  { q: "sensitive text" },
  { action: "correction" },
])("rejects unsupported history filters %j", async (q) => {
  await expect(diaryHistory(client, q)).rejects.toThrow()
})
it("serialises identical concurrent submissions and exact retry, rejects changed request reuse", async () => {
  const p = input(),
    results = await Promise.all([
      submitDiary(client, p),
      submitDiary(client, p),
    ])
  expect(results[0].id).toBe(results[1].id)
  expect(results.filter((r) => r.replayed)).toHaveLength(1)
  expect(await db.clientDiaryEntry.count({ where: { clientId: client } })).toBe(
    1,
  )
  expect(
    await db.auditEvent.count({ where: { targetId: results[0].id } }),
  ).toBe(1)
  await expect(
    submitDiary(client, { ...p, content: "Changed fictional observation" }),
  ).rejects.toMatchObject({ status: 409 })
})
it("exact retry after attendance ends returns the committed original but cannot bypass withdrawn client access", async () => {
  await recorded()
  const p = input({ offShiftReason: "" }),
    saved = await submitDiary(client, p)
  vi.spyOn(Date, "now").mockReturnValue(Date.now() + 7200000)
  expect(await submitDiary(client, p)).toEqual({ id: saved.id, replayed: true })
  await db.employeeHouseAssignment.updateMany({
    where: { employeeId: employee },
    data: { active: false },
  })
  await expect(submitDiary(client, p)).rejects.toMatchObject({ status: 404 })
})
it("rolls back entry if its minimal audit fails", async () => {
  await db.$executeRawUnsafe(
    `CREATE FUNCTION cm2g_fail_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."actorId"='${employee}'::uuid AND NEW.action='diary.submitted' THEN RAISE EXCEPTION 'fictional rollback'; END IF; RETURN NEW; END; $$`,
  )
  await db.$executeRawUnsafe(
    'CREATE TRIGGER cm2g_fail_audit BEFORE INSERT ON "AuditEvent" FOR EACH ROW EXECUTE FUNCTION cm2g_fail_audit()',
  )
  try {
    await expect(submitDiary(client, input())).rejects.toThrow()
    expect(
      await db.clientDiaryEntry.count({ where: { clientId: client } }),
    ).toBe(0)
    expect(await db.auditEvent.count({ where: { organisationId: org } })).toBe(
      0,
    )
  } finally {
    await db.$executeRawUnsafe('DROP TRIGGER cm2g_fail_audit ON "AuditEvent"')
    await db.$executeRawUnsafe("DROP FUNCTION cm2g_fail_audit()")
  }
})
it("HTTP rejects cross-origin and repeated query keys; database failure never falls back", async () => {
  expect(
    (await POST(request(input(), "https://untrusted.example"), context()))
      .status,
  ).toBe(403)
  expect(
    (
      await GET(
        new Request(
          `http://localhost:8558/api/clients/${client}/diary?page=1&page=2`,
        ),
        context(),
      )
    ).status,
  ).toBe(400)
  expect(
    (
      await adminGET(
        new Request(`http://localhost:8558/api/admin/clients/${client}/diary`),
        context(),
      )
    ).status,
  ).toBe(403)
  vi.spyOn(db.clientDiaryEntry, "findMany").mockRejectedValueOnce(
    new Error("private database failure"),
  )
  const response = await GET(
    new Request(`http://localhost:8558/api/clients/${client}/diary`),
    context(),
  )
  expect(response.status).toBe(503)
  expect(await response.text()).not.toMatch(/private|fictional|content/i)
})

it.each([
  {},
  { ruleVersion: "recorded-current-house-v1" },
  { ruleVersion: "invalid", offShift: true },
  { ruleVersion: "recorded-current-house-v1", offShift: "true" },
  { ruleVersion: "recorded-current-house-v1", offShift: false },
])(
  "database rejects partial/malformed documentation context %j",
  async (documentationContext) => {
    const saved = await submitDiary(client, input()),
      row = await db.clientDiaryEntry.findUniqueOrThrow({
        where: { id: saved.id },
      })
    await expect(
      db.clientDiaryEntry.create({
        data: {
          ...row,
          id: randomUUID(),
          requestId: randomUUID(),
          documentationContext,
        },
      }),
    ).rejects.toThrow()
  },
)
