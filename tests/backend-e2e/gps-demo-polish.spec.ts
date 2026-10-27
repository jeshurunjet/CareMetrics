import { test, expect } from "@playwright/test"
import { readFile } from "node:fs/promises"
import { PrismaClient } from "../../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { seedIds as id, seedEmployees } from "../../prisma/seed-data"
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})
let credentials: Record<string, string>
test.beforeAll(async () => {
  if (
    process.env.NEON_BRANCH_NAME !== "local-test" ||
    process.env.CAREMETRICS_TEST_DEMO_GPS !== "true"
  )
    throw Error("Dedicated fictional local demo test required")
  credentials = JSON.parse(
    await readFile(process.env.CAREMETRICS_SEED_CREDENTIALS_FILE!, "utf8"),
  )
  await db.shift.update({
    where: { id: id.shiftA },
    data: {
      startsAt: new Date(Date.now() - 300000),
      endsAt: new Date(Date.now() + 28800000),
    },
  })
})
test.afterAll(async () => {
  await db.$disconnect()
})
async function login(
  page: import("@playwright/test").Page,
  who: string = id.staffA,
) {
  await db.loginAttempt.deleteMany()
  const account = seedEmployees.find((e) => e.id === who)!
  await page.goto("/login")
  await page.getByLabel("Email address", { exact: true }).fill(account.email)
  await page
    .getByLabel("Password", { exact: true })
    .fill(credentials[account.email])
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  await expect(page).toHaveURL(/\/shift-check$/)
}
test("demo polish and recording evidence with real Auth.js and simulated browser GPS (not physical acceptance)", async ({
  page,
  context,
  request,
}) => {
  test.skip(
    page.viewportSize()!.width !== 390,
    "Focused mobile workflow; Admin tested separately at 1280px",
  )
  test.setTimeout(60000)
  let tiles = 0
  await page.route("https://tile.openstreetmap.org/**", async (route) => {
    tiles++
    await route.abort()
  })
  await context.grantPermissions(["geolocation"])
  await context.setGeolocation({
    latitude: 51.5074,
    longitude: -0.1278,
    accuracy: 5,
  })
  await page.addInitScript(() => {
    let calls = 0
    const original = navigator.geolocation.getCurrentPosition.bind(
      navigator.geolocation,
    )
    navigator.geolocation.getCurrentPosition = (...args) => {
      calls++
      original(...args)
    }
    navigator.geolocation.watchPosition = () => {
      throw Error("No continuous tracking")
    }
    Object.defineProperty(window, "gpsCaptureCount", { get: () => calls })
  })
  await login(page)
  await expect(
    page.getByText("Demonstration environment — fictional records."),
  ).toBeVisible()
  expect(
    await page.evaluate(() => Reflect.get(window, "gpsCaptureCount")),
  ).toBe(0)
  await page.getByRole("link", { name: "Continue to dashboard" }).click()
  await expect(page).toHaveURL(/\/dashboard/)
  const photo = page.locator('img[src$="/demo/houses/house-1.webp"]').first()
  await expect(photo).toBeVisible()
  await expect(
    page.getByText("Harbour House", { exact: true }).first(),
  ).toBeVisible()
  await expect(
    page.getByText("Fictional address, New Zealand").first(),
  ).toBeVisible()
  expect(
    await photo.evaluate((n) => (n as HTMLImageElement).naturalWidth),
  ).toBe(1200)
  await expect(
    page.locator('.cm-me-card img[src$="portrait-03.svg"]'),
  ).toBeVisible()
  if (page.viewportSize()!.width === 390)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
  await page.goto(`/clients/${id.clientA}`)
  await expect(
    page.getByText("Sam Parker", { exact: true }).first(),
  ).toBeVisible()
  await expect(page.locator('img[src$="portrait-06.svg"]')).toBeVisible()
  await page.goto(`/houses/${id.houseA}`)
  await expect(
    page.locator('img[src$="/demo/houses/house-1.webp"]').first(),
  ).toBeVisible()
  await page.goto("/shift-check")
  await page.getByRole("button", { name: "Clock In", exact: true }).click()
  await expect(
    page.getByRole("dialog", { name: "Use your current location?" }),
  ).toBeVisible()
  await expect(page.getByText(/seven days/).last()).toBeVisible()
  await page
    .getByRole("button", { name: "Use current location", exact: true })
    .click()
  await expect(
    page.getByText("Clocked in — GPS location recorded.", { exact: true }),
  ).toBeVisible()
  const row = await db.attendanceRecord.findUniqueOrThrow({
    where: { shiftId: id.shiftA },
  })
  expect(row.verification).toBe("GPS_LOCATION_RECORDED_DEMO")
  expect(
    await page.evaluate(() => Reflect.get(window, "gpsCaptureCount")),
  ).toBe(1)
  await page
    .getByRole("link", { name: "View GPS location and attendance" })
    .click()
  await page
    .getByRole("button", { name: "View GPS location", exact: true })
    .click()
  await expect(page.getByText("51.5074000", { exact: true })).toBeVisible()
  const api = await page.request.get(`/api/attendance/${row.id}/location`)
  expect(api.headers()["cache-control"]).toContain("no-store")
  expect(
    (await request.get(`/api/attendance/${row.id}/location`)).status(),
  ).toBe(401)
  expect(
    (
      await page.request.get(`/api/admin/attendance/${row.id}/location`)
    ).status(),
  ).toBe(403)

  expect(tiles).toBe(0)
  await page
    .getByRole("button", { name: "Load location map", exact: true })
    .click()
  await expect(page.locator(".leaflet-container")).toBeVisible()
  await expect(
    page.getByText("OpenStreetMap", { exact: false }).last(),
  ).toBeVisible()
  await page.reload()
  await page
    .getByRole("button", { name: "View GPS location", exact: true })
    .click()
  await expect(page.getByText("51.5074000", { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Clock Out", exact: true }).click()
  await page
    .getByRole("button", { name: "Confirm clock out", exact: true })
    .click()
  await expect
    .poll(
      async () =>
        (await db.attendanceRecord.findUniqueOrThrow({ where: { id: row.id } }))
          .clockOut,
    )
    .not.toBeNull()
  if (page.viewportSize()!.width === 390)
    await page.screenshot({
      path: "/tmp/cm-gps-demo-mobile.png",
      fullPage: true,
    })
  const originalEvidence = await api.json()
  await page.route(`**/api/attendance/${row.id}/location`, (route) =>
    route.fulfill({
      json: {
        ...originalEvidence,
        status: "expired",
        coordinates: null,
        remainingMs: 0,
        expiresAt: new Date(Date.now() - 1).toISOString(),
      },
    }),
  )
  await page.reload()
  await page
    .getByRole("button", { name: "View GPS location", exact: true })
    .click()
  await expect(
    page.getByText(
      "Detailed GPS location is no longer available because the retention period has expired.",
      { exact: true },
    ),
  ).toBeVisible()
  await expect(page.getByText("51.5074000", { exact: true })).toHaveCount(0)
  await expect(page.locator(".leaflet-container")).toHaveCount(0)
})
test("Admin photographs, client avatars and GPS endpoints remain protected", async ({
  page,
}) => {
  test.skip(
    page.viewportSize()!.width < 1024,
    "Existing desktop-only Admin presentation",
  )
  await login(page, id.admin)
  await page.goto("/admin/houses")
  await expect(
    page.locator('img[src$="/demo/houses/house-1.webp"]'),
  ).toBeVisible()
  await expect(
    page.locator('img[src$="/demo/houses/house-2.webp"]'),
  ).toBeVisible()
  await page.goto(`/admin/houses/${id.houseA}`)
  await expect(
    page.getByText("Illustrative photograph; not the fictional address."),
  ).toBeVisible()
  await page.goto(`/admin/clients/${id.clientA}`)
  await expect(page.locator('img[src$="portrait-06.svg"]')).toBeVisible()
  await page.screenshot({ path: "/tmp/cm-gps-demo-admin.png", fullPage: true })
})
