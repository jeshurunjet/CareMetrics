import { test, expect, type Page } from "@playwright/test"
import { readFile } from "node:fs/promises"
import { PrismaClient } from "../../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { seedIds as id } from "../../prisma/seed-data"
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})
let shiftId: string, password: string
interface FakeGPS {
  starts: number
  clears: number
  once: number
  active: Map<number, {
    success: PositionCallback
    error?: PositionErrorCallback | null
  }>
  emit: (latitude?: number, accuracy?: number, age?: number) => void
  fail: (code: number) => void
  freshAccuracy: number
}
declare global {
  interface Window {
    __liveGPS: FakeGPS
  }
}
test.beforeAll(async ({ browserName }, info) => {
  if (info.project.name !== "backend-390") return
  if (browserName !== "chromium")
    throw Error("Focused Chromium fixture required")
  if (
    process.env.NEON_BRANCH_NAME !== "local-test" ||
    process.env.CAREMETRICS_TEST_DEMO_GPS !== "true"
  )
    throw Error("Isolated fictional demo database required")
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
        notes: "Disposable live preview browser fixture",
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
  await page
    .getByLabel("Email address", { exact: true })
    .fill("robin.staff@caremetrics.example.test")
  await page.getByLabel("Password", { exact: true }).fill(password)
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  await expect(page).toHaveURL(/\/shift-check$/)
}
test.beforeEach(async ({ page, context }) => {
  test.skip(
    page.viewportSize()!.width !== 390,
    "Focused mobile acceptance; existing Admin suite covers desktop",
  )
  await context.grantPermissions(["geolocation"])
  await page.route("https://tile.openstreetmap.org/**", (route) =>
    route.abort(),
  )
  await page.addInitScript(() => {
    const active: FakeGPS["active"] = new Map()
    const gps: FakeGPS = (window.__liveGPS = {
      starts: 0,
      clears: 0,
      once: 0,
      active,
      freshAccuracy: 5,
      emit(latitude = 51.5074, accuracy = 5, age = 100) {
        for (const item of active.values())
          item.success({
            coords: { latitude, longitude: -0.1278, accuracy },
            timestamp: Date.now() - age,
          } as GeolocationPosition)
      },
      fail(code) {
        for (const item of [...active.values()])
          item.error?.({ code } as GeolocationPositionError)
      },
    })
    navigator.geolocation.watchPosition = (success, error) => {
      const next = ++gps.starts
      active.set(next, { success, error })
      return next
    }
    navigator.geolocation.clearWatch = (watchId) => {
      gps.clears++
      active.delete(watchId)
    }
    navigator.geolocation.getCurrentPosition = (success) => {
      gps.once++
      success({
        coords: {
          latitude: 51.5074,
          longitude: -0.1278,
          accuracy: gps.freshAccuracy,
        },
        timestamp: Date.now() - 100,
      } as GeolocationPosition)
    }
  })
  await login(page)
})
const panel = (page: Page) =>
  page.getByRole("region", { name: "Your Current Location", exact: true })
async function start(page: Page) {
  await page
    .getByRole("button", { name: "Show Live Location", exact: true })
    .click()
  await expect
    .poll(() => page.evaluate(() => window.__liveGPS.active.size))
    .toBe(1)
}
test("live preview updates marker without recentering and never persists preview positions", async ({
  page,
}) => {
  test.setTimeout(45000)
  const before = await db.attendanceRecord.count(),
    evidence = await db.attendanceLocationEvidence.count()
  await expect(panel(page)).toBeVisible()
  expect(
    await page.evaluate(() => window.__liveGPS.starts + window.__liveGPS.once),
  ).toBe(0)
  await expect(page.locator(".leaflet-container")).toHaveCount(0)
  await start(page)
  await page.evaluate(() => window.__liveGPS.emit())
  await expect(
    panel(page).getByText("51.5074000", { exact: true }),
  ).toBeVisible()
  await expect(page.locator(".leaflet-marker-icon")).toHaveCount(1)
  const mapBox = await page.locator(".leaflet-container").boundingBox()
  await page.locator(".leaflet-container").scrollIntoViewIfNeeded()
  const visibleMap = await page.locator(".leaflet-container").boundingBox()
  expect(mapBox).not.toBeNull()
  expect(visibleMap).not.toBeNull()
  await page.mouse.move(visibleMap!.x + 100, visibleMap!.y + 100)
  await page.mouse.down()
  await page.mouse.move(visibleMap!.x + 150, visibleMap!.y + 120, { steps: 8 })
  await page.mouse.up()
  await page.waitForTimeout(300)
  const marker = await page
    .locator(".leaflet-marker-icon")
    .getAttribute("style")
  const tilePane = await page.locator(".leaflet-map-pane").getAttribute("style")
  const time = await panel(page).locator("time").getAttribute("datetime")
  await page.evaluate(() => window.__liveGPS.emit(51.5084, 7))
  await expect(
    panel(page).getByText("51.5084000", { exact: true }),
  ).toBeVisible()
  await expect(panel(page).getByText("7 m", { exact: true })).toBeVisible()
  await expect
    .poll(() => page.locator(".leaflet-marker-icon").getAttribute("style"))
    .not.toBe(marker)
  expect(await page.locator(".leaflet-map-pane").getAttribute("style")).toBe(
    tilePane,
  )
  expect(await panel(page).locator("time").getAttribute("datetime")).not.toBe(
    time,
  )
  await panel(page)
    .getByRole("button", { name: "Recenter", exact: true })
    .click()
  await expect
    .poll(() => page.locator(".leaflet-map-pane").getAttribute("style"))
    .not.toBe(tilePane)
  await expect(page.getByText(/Some map tiles are unavailable/)).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await page.screenshot({
    path: "/tmp/cm-live-preview-390.png",
    fullPage: true,
  })
  await page
    .getByRole("button", { name: "Stop Live Location", exact: true })
    .click()
  await expect
    .poll(() => page.evaluate(() => window.__liveGPS.active.size))
    .toBe(0)
  await expect(page.locator(".leaflet-container")).toHaveCount(0)
  await expect(
    panel(page).getByText("51.5084000", { exact: true }),
  ).toHaveCount(0)
  expect(await db.attendanceRecord.count()).toBe(before)
  expect(await db.attendanceLocationEvidence.count()).toBe(evidence)
  await start(page)
  await page
    .getByRole("link", { name: "Continue to dashboard", exact: true })
    .click()
  await expect(page).toHaveURL(/\/dashboard$/)
  expect(await page.evaluate(() => window.__liveGPS.active.size)).toBe(0)
})
test("preview handles denial, timeout, offline, background, route modal and logout without accumulating watchers", async ({
  page,
  context,
}) => {
  test.setTimeout(60000)
  await start(page)
  await page.evaluate(() => window.__liveGPS.fail(1))
  await expect(
    panel(page).getByText(/Location permission is required/),
  ).toBeVisible()
  expect(await page.evaluate(() => window.__liveGPS.active.size)).toBe(0)
  await start(page)
  await page.evaluate(() => window.__liveGPS.fail(3))
  await expect(panel(page).getByText(/Location timeout/)).toBeVisible()
  await start(page)
  // Deterministic browser lifecycle fixture, not physical Android background proof.
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    })
    document.dispatchEvent(new Event("visibilitychange"))
  })
  expect(await page.evaluate(() => window.__liveGPS.active.size)).toBe(0)
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    })
    document.dispatchEvent(new Event("visibilitychange"))
  })
  expect(await page.evaluate(() => window.__liveGPS.active.size)).toBe(0)
  await start(page)
  await context.clearPermissions()
  await expect
    .poll(() => page.evaluate(() => window.__liveGPS.active.size))
    .toBe(0)
  await context.grantPermissions(["geolocation"])
  await start(page)
  await context.setOffline(true)
  await expect
    .poll(() => page.evaluate(() => window.__liveGPS.active.size))
    .toBe(0)
  await context.setOffline(false)
  await start(page)
  await page
    .getByRole("button", { name: "View shift details", exact: true })
    .click()
  await expect
    .poll(() => page.evaluate(() => window.__liveGPS.active.size))
    .toBe(0)
  await page.goto("/shift-check")
  await start(page)
  const snapshot = await page.evaluate(() => ({
    starts: window.__liveGPS.starts,
    clears: window.__liveGPS.clears,
  }))
  expect(snapshot.starts - snapshot.clears).toBe(1)
  let stoppedBeforeLogoutRequest = false
  await page.route("**/api/auth/signout", async (route) => {
    stoppedBeforeLogoutRequest = await page.evaluate(
      () => window.__liveGPS.active.size === 0,
    )
    await route.continue()
  })
  await page.getByRole("button", { name: "Menu", exact: true }).click()
  await page
    .getByRole("button", { name: "Sign out", exact: true })
    .filter({ visible: true })
    .click()
  await expect(page).toHaveURL(/\/login$/)
  expect(stoppedBeforeLogoutRequest).toBe(true)
})
test("clock-in rejects poor/stale preview, reuses a valid fix once, stops watch and preserves recorded map/clock-out", async ({
  page,
}) => {
  test.setTimeout(60000)
  await start(page)
  await page.evaluate(() => {
    window.__liveGPS.freshAccuracy = 100
    window.__liveGPS.emit(51.5074, 100)
  })
  await expect(panel(page).getByText(/Poor accuracy/)).toBeVisible()
  await page.getByRole("button", { name: "Clock In", exact: true }).click()
  await page
    .getByRole("button", { name: "Use current location", exact: true })
    .click()
  await expect(
    page.getByRole("dialog").getByText(/Poor accuracy/),
  ).toBeVisible()
  expect(await db.attendanceRecord.count({ where: { shiftId } })).toBe(0)
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel", exact: true })
    .click()
  await page.evaluate(() => {
    window.__liveGPS.freshAccuracy = 100
    window.__liveGPS.emit(51.5074, 5, 61000)
  })
  // An older callback cannot replace the latest sample; age the existing accepted reading explicitly in this fixture.
  await page.reload()
  await start(page)
  await page.evaluate(() => window.__liveGPS.emit(51.5074, 5, 61000))
  await expect(panel(page).getByText(/Stale position/)).toBeVisible()
  await page.evaluate(() => {
    window.__liveGPS.freshAccuracy = 100
  })
  await page.getByRole("button", { name: "Clock In", exact: true }).click()
  await page
    .getByRole("button", { name: "Use current location", exact: true })
    .click()
  await expect(
    page.getByRole("dialog").getByText(/Poor accuracy/),
  ).toBeVisible()
  expect(await db.attendanceRecord.count({ where: { shiftId } })).toBe(0)
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel", exact: true })
    .click()
  await page.evaluate(() => window.__liveGPS.emit())
  const once = await page.evaluate(() => window.__liveGPS.once)
  await page.getByRole("button", { name: "Clock In", exact: true }).click()
  await page
    .getByRole("button", { name: "Use current location", exact: true })
    .click()
  await expect(
    page.getByText("Clocked in — GPS location recorded.", { exact: true }),
  ).toBeVisible()
  expect(await page.evaluate(() => window.__liveGPS.once)).toBe(once)
  expect(await page.evaluate(() => window.__liveGPS.active.size)).toBe(0)
  expect(await db.attendanceRecord.count({ where: { shiftId } })).toBe(1)
  const attendance = await db.attendanceRecord.findUniqueOrThrow({
    where: { shiftId },
  })
  expect(
    await db.attendanceLocationEvidence.count({
      where: { attendanceId: attendance.id },
    }),
  ).toBe(1)
  expect(
    await db.auditEvent.count({
      where: { targetId: attendance.id, action: "attendance.clocked_in" },
    }),
  ).toBe(1)
  const retained = await db.attendanceLocationEvidence.findUniqueOrThrow({
    where: { attendanceId: attendance.id },
  })
  expect(retained.expiresAt.getTime() - attendance.measuredAt!.getTime()).toBe(
    168 * 3600000,
  )
  await page
    .getByRole("link", {
      name: "View GPS location and attendance",
      exact: true,
    })
    .click()
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
        (await db.attendanceRecord.findUniqueOrThrow({ where: { shiftId } }))
          .clockOut,
    )
    .not.toBeNull()
  expect(
    await db.auditEvent.count({
      where: { targetId: attendance.id, action: "attendance.clocked_out" },
    }),
  ).toBe(1)
  await page.goto("/shift-check")
  await expect(
    page.getByRole("button", { name: "Show Live Location", exact: true }),
  ).toBeDisabled()
  expect(await page.evaluate(() => window.__liveGPS.starts)).toBe(0)
})
