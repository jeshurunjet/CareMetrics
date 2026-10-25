import { test, expect, type Page } from "@playwright/test"
import { randomBytes, randomUUID } from "node:crypto"
import { PrismaClient } from "../../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { hashPassword } from "../../src/server/auth/password"
import { readFileSync } from "node:fs"
import type { AttendancePolicy } from "../../src/server/attendance/policy"
const fixture = JSON.parse(
  readFileSync(new URL("../fixtures/gps-policy.json", import.meta.url), "utf8"),
) as AttendancePolicy
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})
let employee: string,
  stranger: string,
  shift: string,
  email: string,
  password: string
const house = fixture.houses[0]
test.beforeAll(async () => {
  if (
    !["local-test", "phase-2a"].includes(process.env.NEON_BRANCH_NAME ?? "") ||
    process.env.NODE_ENV === "production"
  )
    throw new Error("Fictional isolated development only")
  const org = await db.organisation.upsert({
    where: { id: fixture.organisationId },
    create: {
      id: fixture.organisationId,
      name: "Fictional GPS browser test organisation",
    },
    update: {},
  })
  expect(org.name).toBe("Fictional GPS browser test organisation")
  const h = await db.house.upsert({
    where: { id: house.id },
    create: {
      id: house.id,
      organisationId: org.id,
      code: "GPS-TEST",
      name: "Fictional GPS Test House",
      address: "Fictional test location only",
      latitude: house.latitude,
      longitude: house.longitude,
    },
    update: {},
  })
  expect(h.organisationId).toBe(org.id)
  expect(Number(h.latitude)).toBe(house.latitude)
  expect(Number(h.longitude)).toBe(house.longitude)
})
test.beforeEach(async ({ context }) => {
  password = randomBytes(32).toString("base64url")
  email = `gps-browser-${randomUUID()}@example.test`
  const passwordHash = await hashPassword(password)
  employee = (
    await db.user.create({
      data: {
        organisationId: fixture.organisationId,
        employeeCode: randomUUID(),
        email,
        name: "Fictional GPS Browser Worker",
        role: "STAFF",
        status: "ACTIVE",
        passwordHash,
      },
    })
  ).id
  stranger = (
    await db.user.create({
      data: {
        organisationId: fixture.organisationId,
        employeeCode: randomUUID(),
        email: `gps-stranger-${randomUUID()}@example.test`,
        name: "Fictional GPS Unrelated Worker",
        role: "STAFF",
        status: "ACTIVE",
        passwordHash,
      },
    })
  ).id
  await db.employeeHouseAssignment.create({
    data: {
      organisationId: fixture.organisationId,
      employeeId: employee,
      houseId: house.id,
    },
  })
  shift = (
    await db.shift.create({
      data: {
        organisationId: fixture.organisationId,
        employeeId: employee,
        houseId: house.id,
        startsAt: new Date(Date.now() - 300000),
        endsAt: new Date(Date.now() + 28800000),
      },
    })
  ).id
  await context.grantPermissions(["geolocation"])
  await context.setGeolocation({
    latitude: house.latitude,
    longitude: house.longitude,
    accuracy: 5,
  })
  await context.addInitScript(() => {
    let count = 0
    Object.defineProperty(window, "gpsCaptureCount", { get: () => count })
    const original = navigator.geolocation.getCurrentPosition.bind(
      navigator.geolocation,
    )
    navigator.geolocation.getCurrentPosition = (...args) => {
      count++
      original(...args)
    }
    navigator.geolocation.watchPosition = () => {
      throw new Error("Continuous tracking is forbidden")
    }
  })
})
test.afterEach(async () => {
  // Preserve attendance/audit evidence; deactivate only these generated test accounts.
  await db.user.updateMany({
    where: {
      id: { in: [employee, stranger] },
      organisationId: fixture.organisationId,
    },
    data: { status: "INACTIVE" },
  })
})
test.afterAll(async () => {
  await db.$disconnect()
})
async function login(page: Page, address = email) {
  await db.loginAttempt.deleteMany()
  await page.goto("/login", { waitUntil: "domcontentloaded" })
  await page.getByLabel("Email address", { exact: true }).fill(address)
  await page.getByLabel("Password", { exact: true }).fill(password)
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  await expect(page).toHaveURL(/\/shift-check$/)
}
async function explain(page: Page) {
  await page.getByRole("button", { name: "Clock In", exact: true }).click()
  await expect(
    page.getByRole("dialog", { name: "Use your current location?" }),
  ).toBeVisible()
  expect(
    await page.evaluate(() => Reflect.get(window, "gpsCaptureCount")),
  ).toBe(0)
}
async function noRecord() {
  expect(await db.attendanceRecord.count({ where: { shiftId: shift } })).toBe(0)
  expect(
    await db.auditEvent.count({
      where: { actorId: employee, action: "attendance.clocked_in" },
    }),
  ).toBe(0)
}
test("GPS test-policy clock-in persists, survives refresh/fresh login, protects privacy and never tracks Dashboard", async ({
  page,
  browser,
}) => {
  test.setTimeout(90000)
  await login(page)
  expect(
    (await page.request.get("/shift-check")).headers()["permissions-policy"],
  ).toBe("geolocation=(self)")
  expect(
    await page.evaluate(() => Reflect.get(window, "gpsCaptureCount")),
  ).toBe(0)
  await explain(page)
  await page
    .getByRole("button", { name: "Use current location", exact: true })
    .evaluate((button) => {
      ;(button as HTMLButtonElement).click()
      ;(button as HTMLButtonElement).click()
    })
  await expect(page.getByText("Clocked In", { exact: true })).toBeVisible()

  const row = await db.attendanceRecord.findUniqueOrThrow({
    where: { shiftId: shift },
  })
  expect(row.verification).toBe("SERVER_VALIDATED_LOCATION_TEST")
  expect(row.clockOut).toBeNull()
  expect(
    await page.evaluate(() => Reflect.get(window, "gpsCaptureCount")),
  ).toBe(1)
  await page.reload({ waitUntil: "domcontentloaded" })
  await expect(page.getByText("Clocked In", { exact: true })).toBeVisible()
  if (page.viewportSize()?.width === 390) {
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({ path: "/tmp/cm2e-staff-clocked-in-390.png" })
  }
  await expect(
    page.getByRole("button", { name: "Clock In", exact: true }),
  ).toHaveCount(0)
  await expect(
    page.getByRole("button", { name: "Clock Out", exact: true }),
  ).toHaveCount(0)
  await page
    .getByRole("link", { name: "Continue to dashboard", exact: true })
    .click()
  await expect(page).toHaveURL(/\/dashboard$/)
  expect(
    await page.evaluate(() => Reflect.get(window, "gpsCaptureCount")),
  ).toBe(0)
  const next = await browser.newContext({
      baseURL: "http://localhost:8558",
      viewport: page.viewportSize()!,
    }),
    fresh = await next.newPage()
  try {
    await login(fresh)
    await expect(fresh.getByText("Clocked In", { exact: true })).toBeVisible()
    const state = await (
      await fresh.request.get(`/api/attendance/clock-in?shiftId=${shift}`)
    ).json()
    expect(state.attendance.id).toBe(row.id)
    expect(JSON.stringify(state)).not.toMatch(
      /latitude|longitude|requestDigest/,
    )
    const strangerUser = await db.user.findUniqueOrThrow({
      where: { id: stranger },
    })
    await next.clearCookies()
    await login(fresh, strangerUser.email)
    expect(
      (
        await fresh.request.get(`/api/attendance/clock-in?shiftId=${shift}`)
      ).status(),
    ).toBe(404)
    expect((await fresh.request.get(`/api/shifts/${shift}`)).status()).toBe(404)
  } finally {
    await next.close()
  }
  expect(
    await db.auditEvent.count({
      where: { actorId: employee, action: "attendance.clocked_in" },
    }),
  ).toBe(1)
})

for (const scenario of [
  "denied",
  "poor accuracy",
  "outside boundary",
] as const) {
  test(`GPS ${scenario} rejects without attendance or success audit`, async ({
    page,
    context,
  }) => {
    if (scenario === "poor accuracy")
      await context.setGeolocation({
        latitude: house.latitude,
        longitude: house.longitude,
        accuracy: 100,
      })
    if (scenario === "outside boundary")
      await context.setGeolocation({
        latitude: house.latitude + 0.02,
        longitude: house.longitude,
        accuracy: 5,
      })
    if (scenario === "denied")
      await context.addInitScript(() => {
        navigator.geolocation.getCurrentPosition = (_success, failure) =>
          failure?.({ code: 1 } as GeolocationPositionError)
      })
    await login(page)
    await explain(page)
    await page
      .getByRole("button", { name: "Use current location", exact: true })
      .click()
    await expect(
      page.getByText("Clock-in not confirmed", { exact: true }),
    ).toBeVisible()
    await expect(page.getByRole("dialog")).toContainText(/Contact Management/)
    await expect(page.getByText("Clocked In", { exact: true })).toHaveCount(0)
    await noRecord()
  })
}
test("GPS lost-response retry returns the committed event without another location capture", async ({
  page,
}) => {
  await login(page)
  await explain(page)
  let first = true
  await page.route("**/api/attendance/clock-in", async (route) => {
    if (route.request().method() === "POST" && first) {
      first = false
      const response = await route.fetch()
      expect(response.status()).toBe(200)
      await route.abort("failed")
    } else await route.continue()
  })
  await page
    .getByRole("button", { name: "Use current location", exact: true })
    .click()
  await expect(
    page.getByRole("button", { name: "Retry previous request", exact: true }),
  ).toBeVisible()
  const before = await db.attendanceRecord.findUniqueOrThrow({
    where: { shiftId: shift },
  })
  await page
    .getByRole("button", { name: "Retry previous request", exact: true })
    .click()
  await expect(page.getByText("Clocked In", { exact: true })).toBeVisible()
  expect(
    await page.evaluate(() => Reflect.get(window, "gpsCaptureCount")),
  ).toBe(1)
  expect(
    (await db.attendanceRecord.findUniqueOrThrow({ where: { shiftId: shift } }))
      .id,
  ).toBe(before.id)
  expect(
    await db.auditEvent.count({
      where: { actorId: employee, action: "attendance.clocked_in" },
    }),
  ).toBe(1)
})
