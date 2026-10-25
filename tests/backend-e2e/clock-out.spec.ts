import { test, expect, type Page } from "@playwright/test"
import { readFileSync } from "node:fs"
import { randomBytes, randomUUID } from "node:crypto"
import { PrismaClient } from "../../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { hashPassword } from "../../src/server/auth/password"
import type { AttendancePolicy } from "../../src/server/attendance/policy"
const fixture = JSON.parse(
    readFileSync(
      new URL("../fixtures/clock-out-gps-policy.json", import.meta.url),
      "utf8",
    ),
  ) as AttendancePolicy,
  house = fixture.houses[0]
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})
let employee: string,
  manager: string,
  shift: string,
  password: string,
  email: string,
  managerEmail: string
test.beforeAll(async () => {
  if (
    !["local-test", "phase-2a"].includes(process.env.NEON_BRANCH_NAME ?? "") ||
    process.env.NODE_ENV === "production"
  )
    throw new Error("Fictional isolated attendance test environment required")
  const org = await db.organisation.upsert({
    where: { id: fixture.organisationId },
    create: {
      id: fixture.organisationId,
      name: "Fictional Clock-out Browser Organisation",
    },
    update: {},
  })
  expect(org.name).toBe("Fictional Clock-out Browser Organisation")
  const h = await db.house.upsert({
    where: { id: house.id },
    create: {
      id: house.id,
      organisationId: org.id,
      code: "OUT-TEST",
      name: "Fictional Attendance House",
      address: "Fictional location only",
      latitude: house.latitude,
      longitude: house.longitude,
    },
    update: {},
  })
  expect(h.organisationId).toBe(org.id)
  expect(Number(h.latitude)).toBe(house.latitude)
})
test.beforeEach(async ({ context }) => {
  password = randomBytes(32).toString("base64url")
  email = `out-staff-${randomUUID()}@example.test`
  managerEmail = `out-manager-${randomUUID()}@example.test`
  const passwordHash = await hashPassword(password)
  employee = (
    await db.user.create({
      data: {
        organisationId: fixture.organisationId,
        employeeCode: randomUUID(),
        email,
        name: "Fictional Attendance Worker",
        role: "STAFF",
        status: "ACTIVE",
        passwordHash,
      },
    })
  ).id
  manager = (
    await db.user.create({
      data: {
        organisationId: fixture.organisationId,
        employeeCode: randomUUID(),
        email: managerEmail,
        name: "Fictional Attendance Manager",
        role: "MANAGER",
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
      throw new Error("No continuous tracking")
    }
  })
})
test.afterEach(async () => {
  await db.house.update({ where: { id: house.id }, data: { active: true } })
  await db.user.updateMany({
    where: {
      id: { in: [employee, manager] },
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
async function enter(page: Page) {
  await page.getByRole("button", { name: "Clock In", exact: true }).click()
  await page
    .getByRole("button", { name: "Use current location", exact: true })
    .click()
  await expect(page.getByText("Clocked In", { exact: true })).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Clock Out", exact: true }),
  ).toBeVisible()
  return db.attendanceRecord.findUniqueOrThrow({ where: { shiftId: shift } })
}
test("clock-out lifecycle persists history, exposes safe Admin attendance and never captures another position", async ({
  page,
  browser,
}) => {
  test.setTimeout(120000)
  await login(page)
  const before = await enter(page)
  await page.getByRole("button", { name: "Clock Out", exact: true }).click()
  await page
    .getByRole("button", { name: "Confirm clock out", exact: true })
    .evaluate((button) => {
      ;(button as HTMLButtonElement).click()
      ;(button as HTMLButtonElement).click()
    })
  await expect(page.getByText("Clocked Out", { exact: true })).toBeVisible()
  expect(
    await page.evaluate(() => Reflect.get(window, "gpsCaptureCount")),
  ).toBe(1)
  const after = await db.attendanceRecord.findUniqueOrThrow({
    where: { id: before.id },
  })
  expect(after.clockIn).toEqual(before.clockIn)
  expect(after.requestDigest).toBe(before.requestDigest)
  expect(after.policySnapshot).toEqual(before.policySnapshot)
  expect(after.clockOut!.getTime()).toBeGreaterThan(after.clockIn!.getTime())
  await page
    .getByRole("link", { name: "View attendance history", exact: true })
    .click()
  await expect(page).toHaveURL(new RegExp(`attendanceId=${before.id}`))
  await expect(
    page
      .getByRole("dialog", { name: "Attendance details" })
      .getByText("Completed", { exact: true }),
  ).toBeVisible()
  await page.reload({ waitUntil: "domcontentloaded" })
  await expect(
    page.getByRole("dialog").getByText(before.id, { exact: true }),
  ).toBeVisible()
  const history = await (
    await page.request.get(`/api/attendance/${before.id}`)
  ).json()
  expect(history.clockOut).toBe(after.clockOut!.toISOString())
  expect(JSON.stringify(history)).not.toMatch(
    /latitude|longitude|accuracyMetres|measuredAt|requestDigest|policySnapshot/,
  )
  expect(
    (
      await page.request.get("/api/admin/attendance", {
        headers: { "x-role": "ADMINISTRATOR" },
      })
    ).status(),
  ).toBe(403)
  if (page.viewportSize()?.width === 390) {
    await page
      .getByRole("dialog")
      .evaluate((el) =>
        Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)),
      )
    await page.screenshot({ path: "/tmp/cm2f-staff-history-390.png" })
  }
  const adminContext = await browser.newContext({
      baseURL: "http://localhost:8558",
      viewport: { width: 1280, height: 900 },
    }),
    admin = await adminContext.newPage()
  try {
    await login(admin, managerEmail)
    await admin.goto(`/admin/roster?tab=attendance&attendanceId=${before.id}`, {
      waitUntil: "domcontentloaded",
    })
    await expect(
      admin.getByRole("dialog").getByText(before.id, { exact: true }),
    ).toBeVisible()
    await expect(
      admin.getByRole("button", { name: "Clock Out", exact: true }),
    ).toHaveCount(0)
    const read = await (
      await admin.request.get(`/api/admin/attendance/${before.id}`)
    ).json()
    expect(read.employeeId).toBe(employee)
    expect(read.clockOut).toBe(history.clockOut)
    expect(read.clockOutAvailability.available).toBe(false)
    expect(JSON.stringify(read)).not.toMatch(
      /latitude|longitude|accuracyMetres|measuredAt|requestDigest|policySnapshot/,
    )
    if (page.viewportSize()?.width === 390)
      await admin.screenshot({ path: "/tmp/cm2f-admin-attendance-1280.png" })
  } finally {
    await adminContext.close()
  }
  expect(
    await db.auditEvent.count({
      where: { targetId: before.id, action: "attendance.clocked_out" },
    }),
  ).toBe(1)
})
test("lost clock-out response retries the exact committed record without changing timestamps", async ({
  page,
}) => {
  await login(page)
  const before = await enter(page)
  await page.getByRole("button", { name: "Clock Out", exact: true }).click()
  let first = true
  await page.route("**/api/attendance/clock-out", async (route) => {
    if (first) {
      first = false
      expect((await route.fetch()).status()).toBe(200)
      await route.abort("failed")
    } else await route.continue()
  })
  await page
    .getByRole("button", { name: "Confirm clock out", exact: true })
    .click()
  await expect(
    page.getByRole("button", { name: "Retry previous request", exact: true }),
  ).toBeVisible()
  const saved = await db.attendanceRecord.findUniqueOrThrow({
    where: { id: before.id },
  })
  await page
    .getByRole("button", { name: "Retry previous request", exact: true })
    .click()
  await expect(page.getByText("Clocked Out", { exact: true })).toBeVisible()
  expect(
    (await db.attendanceRecord.findUniqueOrThrow({ where: { id: before.id } }))
      .clockOut,
  ).toEqual(saved.clockOut)
  expect(
    await page.evaluate(() => Reflect.get(window, "gpsCaptureCount")),
  ).toBe(1)
  expect(
    await db.auditEvent.count({
      where: { targetId: before.id, action: "attendance.clocked_out" },
    }),
  ).toBe(1)
})
test("own closure stays available after access withdrawal while live house access remains denied", async ({
  page,
}) => {
  await login(page)
  const before = await enter(page)
  await db.employeeHouseAssignment.updateMany({
    where: { employeeId: employee, houseId: house.id },
    data: { active: false },
  })
  await db.house.update({ where: { id: house.id }, data: { active: false } })
  await page.reload({ waitUntil: "domcontentloaded" })
  await expect(page.getByText("Clocked In", { exact: true })).toBeVisible()
  expect(
    (await page.request.get(`/api/houses/${house.id}/clients`)).status(),
  ).toBe(404)
  await page.getByRole("button", { name: "Clock Out", exact: true }).click()
  await page
    .getByRole("button", { name: "Confirm clock out", exact: true })
    .click()
  await expect(page.getByText("Clocked Out", { exact: true })).toBeVisible()
  expect(
    (await db.attendanceRecord.findUniqueOrThrow({ where: { id: before.id } }))
      .clockOut,
  ).not.toBeNull()
  expect(
    await page.evaluate(() => Reflect.get(window, "gpsCaptureCount")),
  ).toBe(0)
  expect(
    (await page.request.get(`/api/houses/${house.id}/clients`)).status(),
  ).toBe(404)
})
