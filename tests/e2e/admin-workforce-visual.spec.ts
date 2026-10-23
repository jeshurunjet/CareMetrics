import { test, expect } from "@playwright/test"
import { mkdir } from "node:fs/promises"
import { hasUiReference } from "../reference-availability"
test.use({ timezoneId: "Pacific/Auckland" })
test("capture workforce source comparisons", async ({ page }, info) => {
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  await page.clock.setFixedTime(new Date("2026-10-22T01:00:00.000Z"))
  await page.route("https://images.unsplash.com/**", (r) =>
    r.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="320"><rect width="640" height="320" fill="#dde8e4"/></svg>',
    }),
  )
  await page.route(/https:\/\/.*basemaps\.cartocdn\.com\/.*/, (r) =>
    r.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#eef0ed"/></svg>',
    }),
  )
  await mkdir("test-results/phase-1e2", { recursive: true })
  const capture = async (side: string, name: string) => {
    await page.evaluate(async () => {
      await document.fonts.ready
      document.querySelector(".ad-content")?.scrollTo(0, 0)
    })
    if (side === "migrated")
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true)
    await page.screenshot({
      path: `test-results/phase-1e2/${info.project.name}-${side}-${name}.png`,
      animations: "disabled",
    })
  }
  await page.goto("/login")
  await page
    .getByRole("button", { name: "Preview administration", exact: true })
    .click()
  if (page.viewportSize()!.width < 1024) {
    await expect(page.locator(".ad-desktop-guard")).toBeVisible()
    await capture("migrated", "desktop-notice")
    if (hasUiReference) {
      await page.goto("http://localhost:8557?screen=admin")
      await capture("original", "desktop-notice")
    }
    expect(errors).toEqual([])
    return
  }
  const nav = async (label: string, original = false) => {
    await page
      .locator(".ad-nav")
      .getByRole(original ? "button" : "link", {
        name: new RegExp(`^${label}(?:\\s|$)`),
      })
      .click()
    await expect(page.getByRole("heading", { level: 1 })).toContainText(label)
  }
  const tab = async (name: string) => {
    await page.getByRole("tab", { name: new RegExp(`^${name}`) }).click()
    await expect(
      page.getByRole("tab", { name: new RegExp(`^${name}`) }),
    ).toHaveAttribute("aria-selected", "true")
  }
  await nav("Rosters & Attendance")
  await expect(page.locator(".ad-week")).toBeVisible()
  await capture("migrated", "roster-calendar")
  await tab("Shift list")
  await expect(
    page.getByRole("columnheader", { name: "Shift status", exact: true }),
  ).toBeVisible()
  await capture("migrated", "shift-list")
  await page.getByRole("button", { name: "Create shift", exact: true }).click()
  await expect(
    page.getByRole("dialog", { name: "Create shift", exact: true }),
  ).toBeVisible()
  await capture("migrated", "create-shift")
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Close", exact: true })
    .click()
  await page.getByPlaceholder("Search employee or ID").fill("sh1")
  await expect(
    page.getByRole("button", { name: "View", exact: true }),
  ).toHaveCount(1)
  await page.getByRole("button", { name: "View", exact: true }).click()
  await expect(
    page.getByRole("dialog", { name: "Shift details", exact: true }),
  ).toBeVisible()
  await capture("migrated", "shift-details")
  await page.getByRole("button", { name: "Edit shift", exact: true }).click()
  await expect(
    page.getByRole("dialog", { name: "Edit shift", exact: true }),
  ).toBeVisible()
  await capture("migrated", "edit-shift")
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Close", exact: true })
    .click()
  await tab("Attendance monitor")
  await expect(
    page.getByRole("columnheader", {
      name: "Location demonstration",
      exact: true,
    }),
  ).toBeVisible()
  await capture("migrated", "attendance-monitor")
  await tab("Timesheets")
  await expect(
    page.getByRole("columnheader", { name: "Correction status", exact: true }),
  ).toBeVisible()
  await capture("migrated", "timesheets")
  await page
    .getByRole("row")
    .filter({ hasText: "Missing Clock-out" })
    .first()
    .getByRole("button", { name: "View details", exact: true })
    .click()
  await expect(
    page.getByRole("dialog", { name: "Attendance details", exact: true }),
  ).toBeVisible()
  await capture("migrated", "timesheet-details")
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Close", exact: true })
    .click()
  await tab("Attendance corrections")
  await page
    .getByRole("button", { name: "attendance-correction-1", exact: true })
    .click()
  await expect(
    page.getByRole("dialog", {
      name: "Attendance correction review",
      exact: true,
    }),
  ).toBeVisible()
  await capture("migrated", "correction-review")
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Close", exact: true })
    .click()
  await nav("Leave Management")
  await expect(
    page.getByRole("button", { name: "Review leave-pending", exact: true }),
  ).toBeVisible()
  await capture("migrated", "leave-requests")
  await page
    .getByRole("button", { name: "Review leave-pending", exact: true })
    .click()
  await expect(page.getByRole("dialog").first()).toContainText("leave-pending")
  await capture("migrated", "leave-review")
  await page.getByRole("button", { name: "Approve", exact: true }).click()
  await expect(
    page.getByRole("dialog", { name: "Approve leave?", exact: true }),
  ).toBeVisible()
  await capture("migrated", "conflict-confirmation")
  await page
    .getByRole("button", { name: "Keep reviewing", exact: true })
    .click()
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Close", exact: true })
    .click()
  await tab("Leave calendar")
  await expect(page.locator(".ad-leave-calendar")).toBeVisible()
  await capture("migrated", "leave-calendar")
  if (hasUiReference) {
    await page.goto("http://localhost:8557?screen=admin")
    await nav("Rosters & Attendance", true)
    await expect(page.locator(".ad-week")).toBeVisible()
    await capture("original", "roster-calendar")
    await tab("Shift list")
    await expect(
      page.getByRole("columnheader", { name: "Shift status", exact: true }),
    ).toBeVisible()
    await capture("original", "shift-list")
    await page
      .getByRole("button", { name: "Create shift", exact: true })
      .click()
    await expect(
      page.getByRole("dialog", { name: "Create shift", exact: true }),
    ).toBeVisible()
    await capture("original", "create-shift")
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Close", exact: true })
      .click()
    await page
      .getByRole("row")
      .filter({ hasText: "Jamie Taufa" })
      .first()
      .click()
    await expect(
      page.getByRole("dialog", { name: "Shift details", exact: true }),
    ).toBeVisible()
    await capture("original", "shift-details")
    await page.getByRole("button", { name: "Edit shift", exact: true }).click()
    await expect(
      page.getByRole("dialog", { name: "Edit shift", exact: true }),
    ).toBeVisible()
    await capture("original", "edit-shift")
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Close", exact: true })
      .click()
    await tab("Attendance monitor")
    await expect(
      page.getByRole("columnheader", { name: "GPS", exact: true }),
    ).toBeVisible()
    await capture("original", "attendance-monitor")
    await tab("Timesheets")
    await expect(
      page.getByRole("columnheader", { name: "Correction", exact: true }),
    ).toBeVisible()
    await capture("original", "timesheets")
    await page
      .getByRole("row")
      .filter({ hasText: "Jamie Taufa" })
      .filter({ hasText: /20\s+Oct/ })
      .click()
    await expect(
      page.getByRole("dialog", { name: "Shift details", exact: true }),
    ).toBeVisible()
    await capture("original", "timesheet-details")
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Close", exact: true })
      .click()
    await tab("Attendance corrections")
    await page
      .getByRole("row")
      .filter({ hasText: "attendance-correction-1" })
      .click()
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Correction",
    )
    await capture("original", "correction-review")
    await nav("Leave Management", true)
    await expect(
      page.getByRole("columnheader", { name: "Roster", exact: true }),
    ).toBeVisible()
    await capture("original", "leave-requests")
    await page
      .getByRole("row")
      .filter({ hasText: "Jamie Taufa" })
      .first()
      .click()
    await expect(page.getByRole("dialog").first()).toContainText("Annual leave")
    await capture("original", "leave-review")
    await page.getByRole("button", { name: "Approve", exact: true }).click()
    await expect(
      page.getByRole("dialog", { name: "Approve leave?", exact: true }),
    ).toBeVisible()
    await capture("original", "conflict-confirmation")
    await page.keyboard.press("Escape")
    await nav("Leave Management", true)
    await page.getByRole("button", { name: "Approved", exact: true }).click()
    await capture("original", "leave-calendar")
  }
  expect(errors).toEqual([])
})
