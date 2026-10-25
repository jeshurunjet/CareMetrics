import { test, expect, type Page } from "@playwright/test"
import { randomBytes, randomUUID } from "node:crypto"
import { readFileSync } from "node:fs"
import { PrismaClient } from "../../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { hashPassword } from "../../src/server/auth/password"
import { careFormV1, careFormV2 } from "../fixtures/care-plan"
import type { AttendancePolicy } from "../../src/server/attendance/policy"
import type { Prisma } from "../../src/generated/prisma/client"
const fixture = JSON.parse(
    readFileSync(
      new URL("../fixtures/care-gps-policy.json", import.meta.url),
      "utf8",
    ),
  ) as AttendancePolicy,
  house = fixture.houses[0],
  destination = "24000000-0000-4000-8000-000000000022",
  db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  }),
  emails = new Map<string, string>()
let employee: string,
  viewer: string,
  manager: string,
  unassigned: string,
  client: string,
  template: string,
  password: string
test.beforeAll(async () => {
  if (
    !["local-test", "phase-2a"].includes(process.env.NEON_BRANCH_NAME ?? "") ||
    process.env.NODE_ENV === "production"
  )
    throw new Error("Fictional isolated Care Plan tests required")
  const org = await db.organisation.upsert({
    where: { id: fixture.organisationId },
    create: {
      id: fixture.organisationId,
      name: "Fictional Care Browser Organisation",
    },
    update: {},
  })
  expect(org.name).toBe("Fictional Care Browser Organisation")
  for (const [id, code, name] of [
    [house.id, "CARE-A", "Fictional Care House"],
    [destination, "CARE-B", "Fictional Care Destination"],
  ]) {
    const row = await db.house.upsert({
      where: { id },
      create: {
        id,
        organisationId: org.id,
        code,
        name,
        address: "Fictional only",
        ...(id === house.id
          ? { latitude: house.latitude, longitude: house.longitude }
          : {}),
      },
      update: {},
    })
    expect(row.organisationId).toBe(org.id)
    expect(row.name).toBe(name)
  }
})
test.beforeEach(async () => {
  password = randomBytes(32).toString("base64url")
  const passwordHash = await hashPassword(password)
  const make = async (name: string, role: "STAFF" | "MANAGER" = "STAFF") => {
    const row = await db.user.create({
      data: {
        organisationId: fixture.organisationId,
        employeeCode: randomUUID(),
        email: `care-${randomUUID()}@example.test`,
        name,
        role,
        status: "ACTIVE",
        passwordHash,
      },
    })
    emails.set(row.id, row.email)
    return row.id
  }
  employee = await make("Fictional Care Worker")
  viewer = await make("Fictional Second Care Worker")
  manager = await make("Fictional Care Manager", "MANAGER")
  unassigned = await make("Fictional Unassigned Worker")
  await db.employeeHouseAssignment.createMany({
    data: [
      {
        organisationId: fixture.organisationId,
        employeeId: employee,
        houseId: house.id,
      },
      {
        organisationId: fixture.organisationId,
        employeeId: viewer,
        houseId: house.id,
      },
      {
        organisationId: fixture.organisationId,
        employeeId: viewer,
        houseId: destination,
      },
    ],
  })
  client = (
    await db.client.create({
      data: {
        organisationId: fixture.organisationId,
        houseId: house.id,
        reference: randomUUID(),
        name: "Fictional Care Client",
      },
    })
  ).id
  template = (
    await db.careTemplate.create({
      data: {
        organisationId: fixture.organisationId,
        name: "Fictional support review",
      },
    })
  ).id
  await db.careTemplateVersion.create({
    data: {
      organisationId: fixture.organisationId,
      templateId: template,
      version: 1,
      definition: careFormV1 as unknown as Prisma.InputJsonObject,
    },
  })
  await db.clientTemplateAssignment.create({
    data: {
      organisationId: fixture.organisationId,
      clientId: client,
      templateId: template,
      version: 1,
    },
  })
})
test.afterEach(async () => {
  await db.user.updateMany({
    where: {
      organisationId: fixture.organisationId,
      id: { in: [employee, viewer, manager, unassigned] },
    },
    data: { status: "INACTIVE" },
  })
})
test.afterAll(async () => {
  await db.$disconnect()
})
async function login(page: Page, id = employee) {
  await page.goto("/login")
  await page.getByRole("button", { name: "Show password", exact: true }).click()
  await page.getByRole("button", { name: "Hide password", exact: true }).click()
  await page.getByLabel("Email address", { exact: true }).fill(emails.get(id)!)
  await page.getByLabel("Password", { exact: true }).fill(password)
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  await expect(page).toHaveURL(/\/shift-check$/)
}
const history = () => `/clients/${client}?tab=care&sub=${template}`
async function editor(page: Page) {
  await page.goto(`/clients/${client}?tab=care`)
  await page.getByRole("link", { name: /Add entry/ }).click()
  await expect(
    page.getByRole("heading", { name: /Fictional support review v/ }),
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Save draft", exact: true }),
  ).toBeDisabled()
}
async function fill(page: Page, reason = true, version = 1) {
  await page
    .getByLabel(
      version === 1 ? "Original observations" : "Updated observations",
      { exact: true },
    )
    .fill("Fictional observations retained with the original questions.")
  await page.getByLabel("Support type", { exact: true }).selectOption("routine")
  await page
    .getByRole("radiogroup", { name: "Fictional rating", exact: true })
    .getByRole("radio", { name: "3", exact: true })
    .click()
  await page
    .getByRole("radiogroup", { name: "Preferences discussed", exact: true })
    .getByRole("radio", { name: "Yes", exact: true })
    .click()
  if (reason)
    await page
      .getByLabel("Reason for off-shift documentation", { exact: true })
      .fill("Fictional notes after handover")
}
async function submit(page: Page, double = false) {
  const button = page.getByRole("button", {
    name: "Submit assessment",
    exact: true,
  })
  if (double)
    await button.evaluate((el) => {
      ;(el as HTMLButtonElement).click()
      ;(el as HTMLButtonElement).click()
    })
  else await button.click()
  await expect(page).toHaveURL(/tab=care&sub=[a-f0-9-]+&item=[a-f0-9-]+$/)
  return new URL(page.url()).searchParams.get("item")!
}
test("Care Plan v1 submit/history/fresh login retain original labels/options/table after v2 assignment and Admin reads the same version", async ({
  page,
  browser,
}) => {
  test.setTimeout(150000)
  await login(page)
  await page
    .getByRole("link", { name: "Continue to dashboard", exact: true })
    .click()
  await page.goto(`/houses/${house.id}`)
  await page.goto(`/clients/${client}`)
  await page.getByRole("tab", { name: "Care Plan", exact: true }).click()
  await page.getByRole("link", { name: /Add entry/ }).click()
  await fill(page, false)
  await page
    .getByRole("button", { name: "Submit assessment", exact: true })
    .click()
  await expect(
    page.getByText(
      "A reason is required outside eligible recorded attendance for this house.",
      { exact: true },
    ),
  ).toBeVisible()
  expect(await db.careRecord.count({ where: { clientId: client } })).toBe(0)
  await page
    .getByLabel("Reason for off-shift documentation", { exact: true })
    .fill("Fictional notes after handover")
  const id = await submit(page),
    before = await db.careRecord.findUniqueOrThrow({ where: { id } })
  await page.reload()
  await expect(
    page.getByText("Original observations", { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText("Original routine choice", { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole("columnheader", { name: "Original item", exact: true }),
  ).toBeVisible()
  await editor(page)
  await fill(page)
  await db.careTemplateVersion.create({
    data: {
      organisationId: fixture.organisationId,
      templateId: template,
      version: 2,
      definition: careFormV2 as unknown as Prisma.InputJsonObject,
    },
  })
  await db.clientTemplateAssignment.updateMany({
    where: {
      organisationId: fixture.organisationId,
      clientId: client,
      templateId: template,
    },
    data: { version: 2 },
  })
  await page
    .getByRole("button", { name: "Submit assessment", exact: true })
    .click()
  await expect(
    page.getByText(
      "The assigned template version changed. Reopen the form and review before submitting.",
      { exact: true },
    ),
  ).toBeVisible()
  await page.getByRole("button", { name: "Cancel", exact: true }).click()
  await page.getByRole("button", { name: "Discard", exact: true }).click()
  await page.goto(`${history()}&item=${id}`)
  await expect(
    page.getByText("Original observations", { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText("Updated observations", { exact: true }),
  ).toHaveCount(0)
  await editor(page)
  await fill(page, true, 2)
  await submit(page)
  expect(await db.careRecord.findUnique({ where: { id } })).toEqual(before)
  const fresh = await browser.newContext({
      viewport: { width: 390, height: 900 },
    }),
    second = await fresh.newPage()
  await login(second, viewer)
  await second.goto(`${history()}&item=${id}`)
  await expect(
    second.getByText("Original template v1 · read-only", { exact: true }),
  ).toBeVisible()
  await fresh.close()
  const denied = await browser.newContext(),
    outsider = await denied.newPage()
  await login(outsider, unassigned)
  expect(
    (
      await outsider.request.get(`/api/clients/${client}/care-records/${id}`)
    ).status(),
  ).toBe(404)
  await denied.close()
  const admin = await browser.newContext({
      viewport: { width: 1280, height: 900 },
    }),
    management = await admin.newPage()
  await login(management, manager)
  await management.goto(`/admin${history()}&item=${id}`)
  const drawer = management.getByRole("dialog")
  await expect(
    drawer.getByText("Original observations", { exact: true }),
  ).toBeVisible()
  await expect(
    drawer.getByText("Original routine choice", { exact: true }),
  ).toBeVisible()
  await expect(
    drawer.getByRole("columnheader", { name: "Original item", exact: true }),
  ).toBeVisible()
  expect(
    (
      await management.request.get(
        `/api/admin/clients/${client}/care-templates/${template}?version=1`,
      )
    ).status(),
  ).toBe(200)
  expect(
    (
      await management.request.post(
        `/api/admin/clients/${client}/care-records`,
        { data: {} },
      )
    ).status(),
  ).toBe(405)
  if (test.info().project.name === "backend-390")
    await management.screenshot({ path: "/tmp/cm2h-admin-history-1280.png" })
  await admin.close()
  await page.goto(`${history()}&item=${id}`)
  expect(
    (
      await page.request.get(`/api/admin/clients/${client}/care-records`)
    ).status(),
  ).toBe(403)
  expect(
    (
      await page.request.post(
        `/api/clients/${client}/care-records/${id}/corrections`,
        { data: {} },
      )
    ).ok(),
  ).toBe(false)
  if (test.info().project.name === "backend-390")
    await page.screenshot({ path: "/tmp/cm2h-staff-history-390.png" })
})
test("Care Plan conditional questions and repeating rows submit against actual on-shift attendance with double-tap protection", async ({
  page,
  context,
}) => {
  await db.shift.create({
    data: {
      organisationId: fixture.organisationId,
      employeeId: employee,
      houseId: house.id,
      startsAt: new Date(Date.now() - 300000),
      endsAt: new Date(Date.now() + 3600000),
    },
  })
  await context.grantPermissions(["geolocation"])
  await context.setGeolocation({
    latitude: house.latitude,
    longitude: house.longitude,
    accuracy: 5,
  })
  await login(page)
  await page.getByRole("button", { name: "Clock In", exact: true }).click()
  await page
    .getByRole("button", { name: "Use current location", exact: true })
    .click()
  await expect(page.getByText("Clocked In", { exact: true })).toBeVisible()
  await editor(page)
  await fill(page, false)
  await page
    .getByLabel("Support type", { exact: true })
    .selectOption("follow-up")
  await page
    .getByRole("button", { name: "Submit assessment", exact: true })
    .click()
  await expect(
    page.getByLabel("Follow-up details", { exact: true }),
  ).toHaveAttribute("aria-invalid", "true")
  await page
    .getByLabel("Follow-up details", { exact: true })
    .fill("Fictional follow-up explanation")
  await page.getByRole("button", { name: "Add Row", exact: true }).click()
  await page
    .getByLabel("Original item · Row 2", { exact: true })
    .fill("Second fictional item")
  await page.getByLabel("Quantity · Row 2", { exact: true }).fill("2")
  await page
    .getByLabel("State · Row 2", { exact: true })
    .selectOption("pending")
  const id = await submit(page, true),
    row = await db.careRecord.findUniqueOrThrow({ where: { id } })
  expect(row.documentationContext).toMatchObject({
    offShift: false,
    attendanceId: expect.any(String),
  })
  expect((row.values as Prisma.JsonObject).items).toHaveLength(2)
  await expect(
    page.getByText("Fictional follow-up explanation", { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole("cell", { name: "Second fictional item", exact: true }),
  ).toBeVisible()
  expect(await db.careRecord.count({ where: { clientId: client } })).toBe(1)
})
test("Care Plan service failure retains answers and lost-response exact retry preserves one original and audit", async ({
  page,
}) => {
  await login(page)
  await editor(page)
  await fill(page)
  await page.route(
    `**/api/clients/${client}/care-records`,
    (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "Service unavailable" }),
      }),
    { times: 1 },
  )
  await page
    .getByRole("button", { name: "Submit assessment", exact: true })
    .click()
  await expect(
    page.getByText("Service unavailable", { exact: true }),
  ).toBeVisible()
  expect(await db.careRecord.count({ where: { clientId: client } })).toBe(0)
  await page.route(
    `**/api/clients/${client}/care-records`,
    async (route) => {
      const response = await route.fetch()
      expect(response.status()).toBe(200)
      await route.abort("failed")
    },
    { times: 1 },
  )
  await page
    .getByRole("button", { name: "Retry previous submission", exact: true })
    .click()
  await expect(
    page.getByText(
      "Submission could not be confirmed. Retry the same request or check history.",
      { exact: true },
    ),
  ).toBeVisible()
  const before = await db.careRecord.findFirstOrThrow({
    where: { clientId: client },
  })
  await page
    .getByRole("button", { name: "Retry previous submission", exact: true })
    .click()
  await expect(page).toHaveURL(new RegExp(`item=${before.id}$`))
  expect(await db.careRecord.findUnique({ where: { id: before.id } })).toEqual(
    before,
  )
  expect(await db.careRecord.count({ where: { clientId: client } })).toBe(1)
  expect(
    await db.auditEvent.count({
      where: { targetId: before.id, action: "care.submitted" },
    }),
  ).toBe(1)
})
test("Care Plan history follows current client access after transfer and preserves original house and version", async ({
  page,
  browser,
}) => {
  await login(page)
  await editor(page)
  await fill(page)
  const id = await submit(page)
  const admin = await browser.newContext(),
    management = await admin.newPage()
  await login(management, manager)
  const current = await db.client.findUniqueOrThrow({ where: { id: client } }),
    response = await management.request.post(
      `/api/admin/clients/${client}/transfer`,
      {
        headers: { Origin: "http://localhost:8558" },
        data: {
          houseId: destination,
          confirmed: true,
          expectedUpdatedAt: current.updatedAt.toISOString(),
        },
      },
    )
  expect(response.status()).toBe(200)
  await admin.close()
  expect(
    (
      await page.request.get(`/api/clients/${client}/care-records/${id}`)
    ).status(),
  ).toBe(404)
  const next = await browser.newContext(),
    reader = await next.newPage()
  await login(reader, viewer)
  await reader.goto(`${history()}&item=${id}`)
  await expect(
    reader.getByText("Original template v1 · read-only", { exact: true }),
  ).toBeVisible()
  expect(
    (await db.careRecord.findUniqueOrThrow({ where: { id } })).houseId,
  ).toBe(house.id)
  await next.close()
})
