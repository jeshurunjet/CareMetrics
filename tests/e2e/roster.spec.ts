import { test, expect, type Page } from "@playwright/test"
import { mkdir } from "node:fs/promises"
import { hasUiReference } from "../reference-availability"
const fixed = "2026-10-22T01:00:00.000Z"
test.use({ timezoneId: "Pacific/Auckland" })
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date(fixed))
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
})
async function bounds(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true)
}
test("shared roster, Clock-in and Dashboard use consistent shifts and full-roster links", async ({
  page,
}) => {
  await page.goto("/shift-check")
  const clock = await page.getByTestId("shift-row").allTextContents()
  await expect(page.getByTestId("shift-row")).toHaveCount(3)
  await page
    .getByRole("button", { name: "View full roster", exact: true })
    .click()
  await expect(
    page.getByRole("heading", { name: "Roster & Timesheets", exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole("tab", { name: "My roster", exact: true }),
  ).toHaveAttribute("aria-selected", "true")
  const roster = await page.getByTestId("shift-row").allTextContents()
  for (const row of clock) expect(roster).toContain(row)
  await page.goto("/dashboard")
  await expect(page.locator(".cm-current")).toContainText("12:00 – 20:00")
  await page.getByRole("button", { name: "Team schedule", exact: true }).click()
  await expect(
    page.getByRole("tab", { name: "Team schedule", exact: true }),
  ).toHaveAttribute("aria-selected", "true")
  await bounds(page)
})
test("calendar keyboard, month and house filters, empty day and overnight day overlap", async ({
  page,
}) => {
  await page.goto("/roster")
  const calendar = page.getByRole("group", {
    name: "Roster calendar",
    exact: true,
  })
  await expect(calendar.locator('button[aria-current="date"]')).toHaveAttribute(
    "data-date",
    "2026-10-22",
  )
  await calendar.locator('[data-date="2026-10-22"]').focus()
  await page.keyboard.press("ArrowLeft")
  await expect(page).toHaveURL(/day=2026-10-21/)
  await expect(calendar.locator('[data-date="2026-10-21"]')).toBeFocused()
  await expect(page.getByTestId("shift-row").first()).toContainText("(+1 day")
  await page.getByRole("button", { name: "Next month", exact: true }).click()
  await expect(page.locator(".cm-cal-head")).toContainText("November 2026")
  await expect(
    page.getByText("No shifts this day", { exact: true }),
  ).toBeVisible()
  await page
    .getByRole("button", { name: "Previous month", exact: true })
    .click()
  await page.getByLabel("Roster house", { exact: true }).selectOption("h2")
  await expect(page).toHaveURL(/house=h2/)
  await expect
    .poll(async () =>
      (await page.getByTestId("shift-row").allTextContents()).every((row) =>
        row.includes("Sunrise House"),
      ),
    )
    .toBe(true)
  for (const row of await page.getByTestId("shift-row").allTextContents())
    expect(row).toContain("Sunrise House")
  await bounds(page)
})
test("shift details support deep refresh, Back, cancelled status and house navigation", async ({
  page,
}) => {
  await page.goto("/roster?shiftId=sh2")
  const dialog = page.getByRole("dialog")
  await expect(dialog).toContainText("Jamie Taufa")
  await expect(dialog).toContainText("Sunrise House")
  await expect(dialog).toContainText("Mere Walker (demo)")
  await page.reload()
  await expect(dialog).toBeVisible()
  await page.getByRole("button", { name: "Open house", exact: true }).click()
  await expect(page).toHaveURL(/\/houses\/h2$/)
  await page.goBack()
  await expect(dialog).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(dialog).toHaveCount(0)
  await page.goto("/roster?shiftId=cancelled")
  await expect(dialog).toContainText("Cancelled")
  await expect(dialog.getByRole("button", { name: /clock in/i })).toHaveCount(0)
})
test("team schedule is grouped, navigable and limited to assigned operational context", async ({
  page,
}) => {
  await page.goto("/roster?tab=team")
  await expect(page.locator(".cm-team-group")).toContainText("Alex Morgan")
  await expect(
    page.getByText("Private coworker attendance example"),
  ).toHaveCount(0)
  await expect(page.getByText(/restricted@example/)).toHaveCount(0)
  await page.getByLabel("Roster house", { exact: true }).selectOption("h2")
  await expect(page).toHaveURL(/house=h2/)
  await expect(page.getByLabel("Roster house", { exact: true })).toHaveValue(
    "h2",
  )
  await page.getByRole("button", { name: "Next day", exact: true }).click()
  await expect(page.locator(".cm-team-group")).toContainText("Sam Wilson")
  await page.locator("summary").click()
  await expect(page.getByRole("table")).not.toBeVisible()
  await page.locator("summary").click()
  await page.getByLabel("Schedule date", { exact: true }).fill("2026-12-01")
  await expect(
    page.getByText("No team shifts this day", { exact: true }),
  ).toBeVisible()
  await bounds(page)
})
test("timesheets show actual values, missing clock-out, date/house filters and pagination", async ({
  page,
}) => {
  await page.goto("/roster?tab=timesheets")
  await expect(page.locator("[data-timesheet-shift]")).toHaveCount(6)
  const overnight = page.locator('[data-timesheet-shift="overnight"]')
  await expect(overnight).toContainText("22:00 – 06:00")
  await expect(overnight).toContainText("21:55")
  await expect(overnight).toContainText("06:05")
  await expect(overnight).toContainText("8h 10m")
  await expect(
    page.locator('[data-timesheet-shift="history-1"]'),
  ).toContainText("Missing Clock-out")
  await expect(
    page.locator('[data-timesheet-shift="history-2"]'),
  ).toContainText("Correction Pending Review")
  await page.getByRole("button", { name: "Next page", exact: true }).click()
  await expect(
    page.locator('[data-timesheet-shift="history-8"]'),
  ).toContainText("Not Clocked In")
  await page.getByLabel("Timesheets from", { exact: true }).fill("2026-10-21")
  await page.getByLabel("Timesheets to", { exact: true }).fill("2026-10-21")
  await expect(page.locator("[data-timesheet-shift]")).toHaveCount(1)
  await page.getByLabel("Roster house", { exact: true }).selectOption("h1")
  await expect(
    page.getByText("No timesheets in this range", { exact: true }),
  ).toBeVisible()
  await bounds(page)
})
test("attendance details distinguish scheduled versus recorded and allow keyboard close/refresh", async ({
  page,
}) => {
  await page.goto("/roster?tab=timesheets&attendanceId=at-overnight")
  const dialog = page.getByRole("dialog")
  await expect(dialog).toContainText("Scheduled shift")
  await expect(dialog).toContainText("8h 0m")
  await expect(dialog).toContainText("8h 10m")
  await expect(dialog).toContainText(
    "Fictional verified event · no real GPS check",
  )
  await page.reload()
  await expect(dialog).toBeVisible()
  await page.getByRole("link", { name: "Related shift", exact: true }).click()
  await expect(dialog).toHaveAccessibleName("Shift details")
  await page.goBack()
  await expect(dialog).toHaveAccessibleName("Attendance details")
  await page.keyboard.press("Escape")
  await expect(dialog).toHaveCount(0)
})
test("attendance corrections validate and retain originals as Pending Review then reset", async ({
  page,
}) => {
  let mutations = 0
  page.on("request", (r) => {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(r.method())) mutations++
  })
  await page.goto(
    "/roster?tab=timesheets&attendanceId=at-overnight&action=correction",
  )
  await page
    .getByRole("button", { name: "Submit request", exact: true })
    .click()
  await expect(
    page.getByText("Please explain why a correction is needed.", {
      exact: true,
    }),
  ).toBeVisible()
  await expect(
    page.getByText("Propose at least one corrected time.", { exact: true }),
  ).toBeVisible()
  await page
    .getByLabel("Proposed clock-out", { exact: true })
    .fill("2026-10-21T20:00")
  await page
    .getByLabel("Reason for correction", { exact: true })
    .fill("Fictional time review")
  await page
    .getByRole("button", { name: "Submit request", exact: true })
    .click()
  await expect(page.getByText(/Clock-out must be after clock-in/)).toBeVisible()
  await page
    .getByLabel("Proposed clock-out", { exact: true })
    .fill("2026-10-22T06:15")
  await page
    .getByRole("button", { name: "Submit request", exact: true })
    .click()
  const dialog = page.getByRole("dialog")
  await expect(dialog).toContainText("Pending Review")
  await expect(dialog).toContainText("06:05")
  await expect(dialog).toContainText("06:15")
  await expect(
    dialog.getByRole("link", { name: "Request correction", exact: true }),
  ).toHaveCount(0)
  await expect(
    page.getByRole("button", { name: /approve|reject/i }),
  ).toHaveCount(0)
  await page.reload()
  await expect(dialog).toContainText("No correction requested.")
  expect(mutations).toBe(0)
})
test("cancelled correction and browser navigation preserve form unless discard is confirmed", async ({
  page,
}) => {
  await page.goto(
    "/roster?tab=timesheets&attendanceId=at-overnight&action=correction",
  )
  await page
    .getByLabel("Reason for correction", { exact: true })
    .fill("Unsaved fictional reason")
  page.once("dialog", (d) => d.dismiss())
  await page.getByRole("button", { name: "Cancel", exact: true }).click()
  await expect(
    page.getByLabel("Reason for correction", { exact: true }),
  ).toHaveValue("Unsaved fictional reason")
  page.once("dialog", (d) => d.accept())
  await page.getByRole("button", { name: "Cancel", exact: true }).click()
  await expect(page.getByRole("dialog")).toContainText(
    "No correction requested.",
  )
})
test("invalid and unrelated schedule, shift and attendance routes fail without metadata", async ({
  page,
}) => {
  for (const query of [
    "tab=bad",
    "house=h3",
    "shiftId=co1",
    "shiftId=restricted-shift",
    "shiftId=missing",
    "attendanceId=coworker-attendance",
    "attendanceId=restricted-attendance",
    "attendanceId=missing",
    "shiftId=sh1&shiftId=sh2",
    "day=2026-02-30",
    "action=correction",
  ]) {
    const response = await page.goto(`/roster?${query}`)
    expect(response?.status()).toBe(404)
    await expect(
      page.getByText("Private coworker attendance example"),
    ).toHaveCount(0)
    await expect(
      page.getByText("Restricted Employee", { exact: true }),
    ).toHaveCount(0)
  }
})
test("capture roster source comparisons and responsive schedule states", async ({
  page,
}, info) => {
  test.setTimeout(120000)
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  await mkdir("test-results/phase-1d1", { recursive: true })
  const capture = async (name: string, focus?: string) => {
    await page.evaluate(() => document.fonts.ready)
    if (focus)
      await page
        .locator(focus)
        .first()
        .evaluate((el) => el.scrollIntoView({ block: "start" }))
    await page.evaluate(() => {
      document.scrollingElement?.scrollTo(0, 0)
      document.querySelector(".cm-app")?.scrollTo(0, 0)
    })
    if (name.startsWith("migrated")) await bounds(page)
    await page.screenshot({
      animations: "disabled",
      style: "nextjs-portal{display:none!important}",
      path: `test-results/phase-1d1/${info.project.name}-${name}.png`,
    })
  }
  await page.goto("/roster")
  await expect(page.locator(".cm-cal button")).toHaveCount(42)
  await capture("migrated-roster")
  await capture("migrated-calendar", ".cm-roster-calendar")
  await page.goto("/roster?shiftId=sh2")
  await expect(page.getByRole("dialog")).toBeVisible()
  await capture("migrated-shift")
  await page.goto("/roster?tab=team")
  await capture("migrated-team", ".cm-team-group")
  await page.goto("/roster?tab=timesheets")
  await expect(page.locator("[data-timesheet-shift]")).toHaveCount(6)
  await capture("migrated-timesheets", ".cm-stat-row")
  await page.goto("/roster?tab=timesheets&attendanceId=at-overnight")
  await expect(page.getByRole("dialog")).toBeVisible()
  await capture("migrated-attendance")
  await page.goto(
    "/roster?tab=timesheets&attendanceId=at-overnight&action=correction",
  )
  await capture("migrated-correction", ".cm-form")
  await page
    .getByRole("button", { name: "Submit request", exact: true })
    .click()
  await capture("migrated-error", ".cm-form")
  await page.goto("/roster?day=2026-12-01&month=2026-12")
  await capture("migrated-empty", ".cm-two-col--roster")
  if (hasUiReference) {
    const original = async (tab?: string) => {
      await page.goto("http://localhost:8557")
      await page
        .locator(".cm-sidebar-nav,.cm-bottom-nav")
        .getByRole("button", { name: /Roster/ })
        .filter({ visible: true })
        .click()
      if (tab) await page.getByRole("tab", { name: tab, exact: true }).click()
    }
    await original()
    await expect(page.locator(".cm-cal button")).toHaveCount(42)
    await capture("original-roster")
    await capture("original-calendar", ".cm-cal-head")
    await page
      .locator(".cm-shift-row")
      .filter({ hasText: "Sunrise House" })
      .first()
      .click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await capture("original-shift")
    await page.getByRole("button", { name: "Close", exact: true }).click()
    await original("Team schedule")
    await capture("original-team", ".cm-table-wrap")
    await original("Timesheets")
    await capture("original-timesheets", ".cm-stat-row")
    // The source has no separate attendance detail view. Its related shift modal is the metadata reference.
    await original()
    await page
      .locator(".cm-cal button")
      .filter({ hasText: /^21$/ })
      .first()
      .click()
    await page.locator(".cm-shift-row").first().click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await capture("original-attendance")
    await original("Timesheets")
    await page
      .locator(".cm-table tbody tr")
      .nth(1)
      .getByRole("button", { name: "Correction", exact: true })
      .click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await capture("original-correction")
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Submit request", exact: true })
      .click()
    await capture("original-error")
    await original()
    await page.getByRole("button", { name: "Next month", exact: true }).click()
    await page.getByRole("button", { name: "Next month", exact: true }).click()
    await page
      .locator(".cm-cal button")
      .filter({ hasText: /^1$/ })
      .first()
      .click()
    await capture("original-empty", ".cm-two-col--roster")
  }
  expect(errors).toEqual([])
})
