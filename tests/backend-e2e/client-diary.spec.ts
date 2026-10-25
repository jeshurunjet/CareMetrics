import { test, expect, type Page } from "@playwright/test"
import { readFileSync } from "node:fs"
import { randomBytes, randomUUID } from "node:crypto"
import { PrismaClient } from "../../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { hashPassword } from "../../src/server/auth/password"
import type { AttendancePolicy } from "../../src/server/attendance/policy"
const fixture = JSON.parse(
    readFileSync(
      new URL("../fixtures/diary-gps-policy.json", import.meta.url),
      "utf8",
    ),
  ) as AttendancePolicy,
  house = fixture.houses[0],
  destination = "23000000-0000-4000-8000-000000000022",
  db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  })
let employee: string,
  viewer: string,
  manager: string,
  unassigned: string,
  client: string,
  password: string
const emails = new Map<string, string>()
test.beforeAll(async () => {
  if (
    !["local-test", "phase-2a"].includes(process.env.NEON_BRANCH_NAME ?? "") ||
    process.env.NODE_ENV === "production"
  )
    throw new Error("Fictional isolated Diary tests required")
  const org = await db.organisation.upsert({
    where: { id: fixture.organisationId },
    create: {
      id: fixture.organisationId,
      name: "Fictional Diary Browser Organisation",
    },
    update: {},
  })
  expect(org.name).toBe("Fictional Diary Browser Organisation")
  for (const [id, code, name] of [
    [house.id, "DIARY-A", "Fictional Diary House"],
    [destination, "DIARY-B", "Fictional Destination House"],
  ]) {
    const row = await db.house.upsert({
      where: { id },
      create: {
        id,
        organisationId: org.id,
        code,
        name,
        address: "Fictional location only",
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
  const create = async (name: string, role: "STAFF" | "MANAGER" = "STAFF") => {
    const row = await db.user.create({
      data: {
        organisationId: fixture.organisationId,
        employeeCode: randomUUID(),
        email: `diary-${randomUUID()}@example.test`,
        name,
        role,
        status: "ACTIVE",
        passwordHash,
      },
    })
    emails.set(row.id, row.email)
    return row.id
  }
  employee = await create("Fictional Diary Worker")
  viewer = await create("Fictional Second Diary Worker")
  unassigned = await create("Fictional Unassigned Worker")
  manager = await create("Fictional Diary Manager", "MANAGER")
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
        name: "Fictional Diary Client",
        reference: randomUUID(),
      },
    })
  ).id
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
  // Exercise a hydrated control before entering credentials; never print credential assertions.
  await page.getByRole("button", { name: "Show password", exact: true }).click()
  await expect(
    page.getByRole("button", { name: "Hide password", exact: true }),
  ).toBeVisible()
  await page.getByRole("button", { name: "Hide password", exact: true }).click()
  await page.getByLabel("Email address", { exact: true }).fill(emails.get(id)!)
  await page.getByLabel("Password", { exact: true }).fill(password)
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  await expect(page).toHaveURL(/\/shift-check$/)
}
async function editor(page: Page) {
  await page.goto(`/clients/${client}?tab=diary`)
  await page.getByRole("link", { name: "New entry", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "New diary entry", exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Save draft", exact: true }),
  ).toBeDisabled()
}
async function fill(page: Page, reason = true) {
  await page
    .getByLabel("Entry title", { exact: true })
    .fill("Fictional daily observation")
  await page
    .getByLabel("Category", { exact: true })
    .selectOption("progress-notes")
  await page
    .getByLabel("Diary entry", { exact: true })
    .fill(
      "Fictional observation for backend acceptance. <script>window.diaryInjected=1</script>",
    )
  if (reason)
    await page
      .getByLabel("Reason for off-shift documentation", { exact: true })
      .fill("Completing fictional notes after handover")
}
async function submit(page: Page, double = false) {
  const button = page.getByRole("button", { name: "Submit entry", exact: true })
  if (double)
    await button.evaluate((el) => {
      ;(el as HTMLButtonElement).click()
      ;(el as HTMLButtonElement).click()
    })
  else await button.click()
  await expect(page).toHaveURL(/tab=diary&item=[a-f0-9-]+$/)
  return new URL(page.url()).searchParams.get("item")!
}
test("Diary off-shift validation, commit, refresh, fresh session and second Staff/Admin read the same original", async ({
  page,
  browser,
}) => {
  test.setTimeout(120000)
  await login(page)
  await page
    .getByRole("link", { name: "Continue to dashboard", exact: true })
    .click()
  await page.goto(`/houses/${house.id}`)
  await page.goto(`/clients/${client}`)
  await page.getByRole("tab", { name: "Diary", exact: true }).click()
  await page.getByRole("link", { name: "New entry", exact: true }).click()
  await fill(page, false)
  await page.getByRole("button", { name: "Submit entry", exact: true }).click()
  await expect(
    page.getByText(
      "A reason is required outside eligible recorded attendance for this house.",
      { exact: true },
    ),
  ).toBeVisible()
  expect(await db.clientDiaryEntry.count({ where: { clientId: client } })).toBe(
    0,
  )
  await page
    .getByLabel("Reason for off-shift documentation", { exact: true })
    .fill("Completing fictional notes after handover")
  const id = await submit(page)
  await expect(
    page.getByRole("heading", {
      name: "Fictional daily observation",
      exact: true,
    }),
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByText(
      "Fictional observation for backend acceptance. <script>window.diaryInjected=1</script>",
      { exact: true },
    ),
  ).toBeVisible()
  expect(await page.evaluate(() => "diaryInjected" in window)).toBe(false)
  expect(
    (await db.clientDiaryEntry.findUniqueOrThrow({ where: { id } })).authorId,
  ).toBe(employee)
  const own = await page.request.get(`/api/clients/${client}/diary/${id}`)
  expect(own.status()).toBe(200)
  expect(own.headers()["cache-control"]).toContain("no-store")
  expect(await own.text()).not.toMatch(
    /requestDigest|documentationContext|passwordHash/,
  )
  expect(
    (await page.request.get(`/api/admin/clients/${client}/diary`)).status(),
  ).toBe(403)
  expect(
    (
      await page.request.patch(`/api/clients/${client}/diary/${id}`, {
        data: { content: "overwrite" },
      })
    ).status(),
  ).toBe(405)
  expect(
    (
      await page.request.post(
        `/api/clients/${client}/diary/${id}/corrections`,
        { data: {} },
      )
    ).ok(),
  ).toBe(false)
  const other = await browser.newContext({
      viewport: { width: 390, height: 900 },
    }),
    second = await other.newPage()
  await login(second, viewer)
  await second.goto(`/clients/${client}?tab=diary&item=${id}`)
  await expect(
    second.getByRole("heading", {
      name: "Fictional daily observation",
      exact: true,
    }),
  ).toBeVisible()
  await other.close()
  const fresh = await browser.newContext({
      viewport: { width: 390, height: 900 },
    }),
    again = await fresh.newPage()
  await login(again)
  await again.goto(`/clients/${client}?tab=diary&item=${id}`)
  await expect(
    again
      .locator(".cm-dl")
      .getByText("Fictional Diary Worker", { exact: true }),
  ).toBeVisible()
  await fresh.close()
  const admin = await browser.newContext({
      viewport: { width: 1280, height: 900 },
    }),
    management = await admin.newPage()
  await login(management, manager)
  await management.goto(`/admin/clients/${client}?tab=diary&item=${id}`)
  await expect(
    management.getByRole("heading", {
      name: "Fictional daily observation",
      exact: true,
    }),
  ).toBeVisible()
  await expect(
    management.getByText("Submitted Client Diary · read-only", { exact: true }),
  ).toBeVisible()
  expect(
    (
      await management.request.get(`/api/admin/clients/${client}/diary/${id}`)
    ).status(),
  ).toBe(200)
  expect(
    (
      await management.request.post(`/api/admin/clients/${client}/diary`, {
        data: {},
      })
    ).status(),
  ).toBe(405)
  if (test.info().project.name === "backend-390")
    await management.screenshot({ path: "/tmp/cm2g-admin-diary-1280.png" })
  await admin.close()
  if ((page.viewportSize()?.width ?? 1280) < 768) {
    await page.getByRole("button", { name: "Menu", exact: true }).click()
    await page
      .getByRole("dialog", { name: "Menu" })
      .getByRole("button", { name: "Sign out", exact: true })
      .click()
  } else
    await page
      .locator(".cm-sidebar")
      .getByRole("button", { name: "Sign out", exact: true })
      .click()
  await expect(page).toHaveURL(/\/login$/)
  await login(page)
  await page.goto(`/clients/${client}?tab=diary&item=${id}`)
  await expect(
    page.getByRole("heading", {
      name: "Fictional daily observation",
      exact: true,
    }),
  ).toBeVisible()
  if (test.info().project.name === "backend-390")
    await page.screenshot({ path: "/tmp/cm2g-staff-diary-390.png" })
})
test("Diary on-shift eligibility comes from the actual GPS clock-in for this house", async ({
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
  await expect(
    page.getByText(/Eligible recorded attendance for this house was found/),
  ).toBeVisible()
  await fill(page, false)
  const id = await submit(page, true)
  expect(
    (await db.clientDiaryEntry.findUniqueOrThrow({ where: { id } }))
      .documentationContext,
  ).toMatchObject({ offShift: false, attendanceId: expect.any(String) })
})
test("Diary retains input on service failure and exact retry after a lost committed response creates one original", async ({
  page,
}) => {
  await login(page)
  await editor(page)
  await fill(page)
  await page.route(
    `**/api/clients/${client}/diary`,
    (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "Service unavailable" }),
      }),
    { times: 1 },
  )
  await page.getByRole("button", { name: "Submit entry", exact: true }).click()
  await expect(
    page.getByText("Service unavailable", { exact: true }),
  ).toBeVisible()
  expect(await db.clientDiaryEntry.count({ where: { clientId: client } })).toBe(
    0,
  )
  await page.route(
    `**/api/clients/${client}/diary`,
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
  const original = await db.clientDiaryEntry.findFirstOrThrow({
    where: { clientId: client },
  })
  await page
    .getByRole("button", { name: "Retry previous submission", exact: true })
    .click()
  await expect(page).toHaveURL(new RegExp(`item=${original.id}$`))
  expect(await db.clientDiaryEntry.count({ where: { clientId: client } })).toBe(
    1,
  )
  expect(
    await db.auditEvent.count({
      where: { targetId: original.id, action: "diary.submitted" },
    }),
  ).toBe(1)
  expect(
    await db.clientDiaryEntry.findUnique({ where: { id: original.id } }),
  ).toEqual(original)
})
test("Diary current client access changes on management transfer while original house and author remain", async ({
  page,
  browser,
}) => {
  await login(page)
  await editor(page)
  await fill(page)
  const id = await submit(page)
  const denied = await browser.newContext(),
    outsider = await denied.newPage()
  await login(outsider, unassigned)
  expect(
    (await outsider.request.get(`/api/clients/${client}/diary/${id}`)).status(),
  ).toBe(404)
  await denied.close()
  const admin = await browser.newContext(),
    management = await admin.newPage()
  await login(management, manager)
  const current = await db.client.findUniqueOrThrow({ where: { id: client } })
  const response = await management.request.post(
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
    (await page.request.get(`/api/clients/${client}/diary/${id}`)).status(),
  ).toBe(404)
  const next = await browser.newContext(),
    reader = await next.newPage()
  await login(reader, viewer)
  await reader.goto(`/clients/${client}?tab=diary&item=${id}`)
  await expect(
    reader.getByRole("heading", {
      name: "Fictional daily observation",
      exact: true,
    }),
  ).toBeVisible()
  expect(
    (await db.clientDiaryEntry.findUniqueOrThrow({ where: { id } })).houseId,
  ).toBe(house.id)
  await next.close()
})
