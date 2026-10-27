import { test, expect, type Page } from "@playwright/test"
import { readFile } from "node:fs/promises"
import { PrismaClient } from "../../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { seedIds as id } from "../../prisma/seed-data"
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})
let password: string, shiftId: string
const focused = process.env.CAREMETRICS_TEST_GOOGLE_DEMO === "true"
test.beforeAll(async ({ browserName }, info) => {
  if (!focused || info.project.name !== "backend-390") return
  if (
    browserName !== "chromium" ||
    process.env.NEON_BRANCH_NAME !== "local-test"
  )
    throw Error("Disposable local browser fixture required")
  const credentials = JSON.parse(
    await readFile(process.env.CAREMETRICS_SEED_CREDENTIALS_FILE!, "utf8"),
  )
  password = credentials["robin.staff@caremetrics.example.test"]
  shiftId = (
    await db.shift.create({
      data: {
        organisationId: id.organisation,
        employeeId: id.staffA,
        houseId: id.houseA,
        startsAt: new Date(Date.now() - 600000),
        endsAt: new Date(Date.now() + 7200000),
        notes: "Disposable Google evaluation fixture",
      },
    })
  ).id
})
test.afterAll(async () => {
  await db.$disconnect()
})
async function login(page: Page) {
  await db.loginAttempt.deleteMany()
  await page.goto("/login")
  await expect(page.locator("#caremetrics-google-maps-demo")).toHaveCount(0)
  await page
    .getByLabel("Email address", { exact: true })
    .fill("robin.staff@caremetrics.example.test")
  await page.getByLabel("Password", { exact: true }).fill(password)
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  await expect(page).toHaveURL(/\/shift-check$/)
}
const panel = (page: Page) =>
  page.getByRole("region", { name: "Your Current Location", exact: true })
test.beforeEach(async ({ page }) => {
  test.skip(
    !focused || page.viewportSize()!.width !== 390,
    "Opt-in fictional Google demo acceptance",
  )
  if (process.env.CAREMETRICS_GOOGLE_REAL_SMOKE === "true") return
  await page.route("https://maps.googleapis.com/maps/api/js?**", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `
    window.__googleFixture = { markers: [], centres: [], pans: [] };
    window.google = { maps: {
      Map: class { constructor(el, options) { el.textContent = 'Mock Google map'; this.setCenter(options.center) } setCenter(p) { window.__googleFixture.centres.push(p) } panTo(p) { window.__googleFixture.pans.push(p) } },
      Circle: class { setMap() {} },
      marker: { AdvancedMarkerElement: class { constructor(options) { Object.assign(this, options); window.__googleFixture.markers.push(this) } } },
      event: { clearInstanceListeners() {} }
    } }; window.cmGoogleMapsReady();`,
    }),
  )
  await page.addInitScript(() => {
    let callback: PositionCallback | undefined
    const state = {
      starts: 0,
      clears: 0,
      active: false,
      emit: () =>
        callback?.({
          coords: { latitude: 51.5074, longitude: -0.1278, accuracy: 5 },
          timestamp: Date.now() - 100,
        } as GeolocationPosition),
    }
    Object.assign(window, { __googleGPS: state })
    navigator.geolocation.watchPosition = (success) => {
      callback = success
      state.starts++
      state.active = true
      return state.starts
    }
    navigator.geolocation.clearWatch = () => {
      state.clears++
      state.active = false
      callback = undefined
    }
  })
})
// Test globals exist only in the test-injected SDK/GPS, never application bundles.
interface GPSFixture {
  starts: number
  active: boolean
  emit: () => void
}
interface MapFixture {
  markers: Array<{
    map: unknown
    title: string
    position: unknown
  }>
  centres: unknown[]
  pans: unknown[]
}
function gps(page: Page) {
  return page.evaluate(
    () => (window as unknown as { __googleGPS: GPSFixture }).__googleGPS.active,
  )
}
test("Google demo permission, lifecycle, map failure and preview do not persist attendance", async ({
  page,
  context,
}) => {
  test.skip(process.env.CAREMETRICS_GOOGLE_REAL_SMOKE === "true")
  await context.clearPermissions()
  const before = await db.attendanceRecord.count(),
    evidence = await db.attendanceLocationEvidence.count()
  await login(page)
  await expect(
    panel(page).getByText("Mock Google map", { exact: true }),
  ).toBeVisible()
  expect(await gps(page)).toBe(false)
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { __googleFixture: MapFixture }).__googleFixture
          .markers.length,
    ),
  ).toBe(1)
  await context.grantPermissions(["geolocation"])
  await panel(page)
    .getByRole("button", { name: "Show Live Location", exact: true })
    .click()
  await expect.poll(() => gps(page)).toBe(true)
  await page.evaluate(() =>
    (window as unknown as { __googleGPS: GPSFixture }).__googleGPS.emit(),
  )
  await expect(
    panel(page).getByText(/Outside the proposed 10-metre demo area/),
  ).toBeVisible()
  await panel(page)
    .getByRole("button", { name: "Recenter", exact: true })
    .click()
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { __googleFixture: MapFixture }).__googleFixture
          .pans.length,
    ),
  ).toBe(1)
  await page.evaluate(() => window.gm_authFailure?.())
  await expect(
    panel(page).getByText(/Google Maps unavailable or demo quota reached/),
  ).toBeVisible()
  await expect(
    panel(page).getByText("51.5074000", { exact: true }),
  ).toBeVisible()
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    })
    document.dispatchEvent(new Event("visibilitychange"))
  })
  await expect.poll(() => gps(page)).toBe(false)
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    })
    document.dispatchEvent(new Event("visibilitychange"))
  })
  expect(await gps(page)).toBe(false)
  // Android may recreate a document after backgrounding: a boolean session guard still prevents auto capture.
  await page.reload()
  await expect(
    panel(page).getByText("Mock Google map", { exact: true }),
  ).toBeVisible()
  expect(await gps(page)).toBe(false)
  await panel(page)
    .getByRole("button", { name: "Show Live Location", exact: true })
    .click()
  await expect.poll(() => gps(page)).toBe(true)
  await panel(page)
    .getByRole("button", { name: "Stop Live Location", exact: true })
    .click()
  await expect.poll(() => gps(page)).toBe(false)
  expect(await db.attendanceRecord.count()).toBe(before)
  expect(await db.attendanceLocationEvidence.count()).toBe(evidence)
  await page
    .getByRole("link", { name: "Continue to dashboard", exact: true })
    .click()
  await expect(page).toHaveURL(/\/dashboard$/)
})
test("Google demo auto-detects previously granted permission and accepts outside-reference clock-in once", async ({
  page,
  context,
}) => {
  test.skip(process.env.CAREMETRICS_GOOGLE_REAL_SMOKE === "true")
  await context.grantPermissions(["geolocation"])
  await login(page)
  await expect.poll(() => gps(page)).toBe(true)
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { __googleGPS: GPSFixture }).__googleGPS.starts,
    ),
  ).toBe(1)
  await page.evaluate(() =>
    (window as unknown as { __googleGPS: GPSFixture }).__googleGPS.emit(),
  )
  await page.getByRole("button", { name: "Clock In", exact: true }).click()
  await page
    .getByRole("button", { name: "Use current location", exact: true })
    .click()
  await expect(
    page.getByText(/Clock-in accepted for demonstration only/),
  ).toBeVisible()
  await expect.poll(() => gps(page)).toBe(false)
  const record = await db.attendanceRecord.findUniqueOrThrow({
    where: { shiftId },
  })
  expect(record.verification).toBe("GPS_LOCATION_RECORDED_DEMO")
  expect(
    await db.attendanceLocationEvidence.count({
      where: { attendanceId: record.id },
    }),
  ).toBe(1)
  expect(
    await db.auditEvent.count({
      where: { targetId: record.id, action: "attendance.clocked_in" },
    }),
  ).toBe(1)
})
test("Google real Demo Key renders public Glenfield Mall reference without reading GPS", async ({
  page,
  context,
}) => {
  test.skip(
    process.env.CAREMETRICS_GOOGLE_REAL_SMOKE !== "true",
    "Private operator opt-in; public-point SDK smoke only",
  )
  await context.clearPermissions()
  await login(page)
  await page
    .getByRole("region", { name: "Google Maps location preview", exact: true })
    .scrollIntoViewIfNeeded()
  await expect(panel(page).locator(".gm-style")).toBeVisible({ timeout: 20000 })
  await expect(panel(page).getByText(/Google Maps unavailable/)).toHaveCount(0)
  await expect(
    panel(page).getByRole("button", {
      name: "Show Live Location",
      exact: true,
    }),
  ).toBeVisible()
  await expect(panel(page).getByText("Latitude", { exact: true })).toHaveCount(
    0,
  )
})
