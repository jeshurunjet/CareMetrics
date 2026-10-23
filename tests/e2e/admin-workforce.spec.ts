import { test, expect, type Page } from "@playwright/test"
import { mkdir } from "node:fs/promises"
test.use({ timezoneId: "Pacific/Auckland" })
test.beforeEach(async ({ page }) => {
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
})
async function enter(page: Page) {
  test.skip(
    page.viewportSize()!.width < 1024,
    "Desktop management; narrow guard verified separately.",
  )
  await page.goto("/login")
  await page
    .getByRole("button", { name: "Preview administration", exact: true })
    .click()
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Kia ora")
}
async function nav(page: Page, label: string) {
  await page
    .locator(".ad-nav")
    .getByRole("link", { name: new RegExp(`^${label}(?:\\s|$)`) })
    .click()
  await expect(page.getByRole("heading", { level: 1 })).toContainText(label)
}
async function backToAdmin(page: Page) {
  for (
    let i = 0;
    i < 12 && !new URL(page.url()).pathname.startsWith("/admin/");
    i++
  )
    await page.goBack()
  await expect(page.locator(".ad-nav")).toBeVisible()
}
async function staff(page: Page) {
  await page.locator(".ad-account").click()
  await page
    .getByRole("link", { name: "View Staff application", exact: true })
    .click()
  await expect(page).toHaveURL(/\/profile$/)
}
async function staffNav(page: Page, name: string) {
  await page
    .locator(".cm-sidebar")
    .getByRole("button", { name, exact: true })
    .click()
}
async function create(page: Page) {
  await nav(page, "Rosters & Attendance")
  await page.getByRole("button", { name: "Create shift", exact: true }).click()
  const d = page.getByRole("dialog", { name: "Create shift", exact: true })
  await d.getByLabel("Employee", { exact: true }).selectOption("s1")
  await d.getByLabel("House", { exact: true }).selectOption("h1")
  await d.getByLabel("Shift date", { exact: true }).fill("2026-10-22")
  await d.getByLabel("Start", { exact: true }).fill("21:00")
  await d.getByLabel("End", { exact: true }).fill("23:00")
  await d
    .getByLabel("Notes", { exact: true })
    .fill("Shared workforce browser shift")
  await d.getByRole("button", { name: "Publish shift", exact: true }).click()
  await expect(
    page.getByRole("dialog", { name: "Shift details", exact: true }),
  ).toBeVisible()
  return new URL(page.url()).searchParams.get("shiftId")!
}
test("workforce remains desktop only at narrow widths", async ({ page }) => {
  await page.goto("/admin/roster")
  if (page.viewportSize()!.width < 1024) {
    await expect(page.locator(".ad-desktop-guard")).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Create shift", exact: true }),
    ).toBeHidden()
  } else {
    await expect(
      page.getByText(
        "Staff and Senior Staff cannot use Admin management screens or mutations.",
        { exact: true },
      ),
    ).toBeVisible()
  }
})
test("create edit and cancel preserve one shift ID and Staff roster propagation", async ({
  page,
}) => {
  await enter(page)
  const id = await create(page)
  let d = page.getByRole("dialog", { name: "Shift details", exact: true })
  await d.getByRole("button", { name: "Close", exact: true }).click()
  await page.getByRole("tab", { name: "Shift list", exact: true }).click()
  await expect(
    page.getByRole("columnheader", { name: "Shift status", exact: true }),
  ).toBeVisible()
  await page.getByPlaceholder("Search employee or ID").fill(id)
  await expect(
    page.getByRole("button", { name: "Edit", exact: true }),
  ).toHaveCount(1)
  await page.getByRole("button", { name: "Edit", exact: true }).click()
  d = page.getByRole("dialog", { name: "Edit shift", exact: true })
  await d.getByLabel("Start", { exact: true }).fill("22:00")
  await d.getByRole("button", { name: "Save changes", exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`shiftId=${id}`))
  d = page.getByRole("dialog", { name: "Shift details", exact: true })
  await expect(d).toContainText("22:00")
  await d.getByRole("button", { name: "Close", exact: true }).click()
  await staff(page)
  await staffNav(page, "Roster & Timesheets")
  await page.getByRole("tab", { name: /My roster/ }).click()
  await page
    .getByTestId("shift-row")
    .filter({ hasText: "22:00 – 23:00" })
    .first()
    .click()
  await expect(page).toHaveURL(new RegExp(`shiftId=${id}`))
  await page.keyboard.press("Escape")
  await staffNav(page, "Clock-in / My Shifts")
  await page
    .getByTestId("shift-row")
    .filter({ hasText: "22:00 – 23:00" })
    .first()
    .click()
  await expect(page.getByRole("dialog")).toContainText(
    "Shared workforce browser shift",
  )
  await page.keyboard.press("Escape")
  await backToAdmin(page)
  await nav(page, "Rosters & Attendance")
  await page.getByRole("tab", { name: "Shift list", exact: true }).click()
  await expect(
    page.getByRole("columnheader", { name: "Shift status", exact: true }),
  ).toBeVisible()
  await page.getByPlaceholder("Search employee or ID").fill(id)
  await page.getByRole("button", { name: "Cancel shift", exact: true }).click()
  d = page.getByRole("dialog", { name: "Shift details", exact: true })
  const confirm = page.getByRole("dialog", {
    name: "Cancel this shift?",
    exact: true,
  })
  await expect(confirm).toContainText(
    "no longer be an active upcoming assignment",
  )
  await confirm
    .getByRole("button", { name: "Cancel shift", exact: true })
    .click()
  await expect(d).toContainText("Cancelled")
  await d.getByRole("button", { name: "Close", exact: true }).click()
  await staff(page)
  await staffNav(page, "Clock-in / My Shifts")
  await expect(
    page.getByTestId("shift-row").filter({ hasText: "22:00 – 23:00" }),
  ).toHaveCount(0)
})
test("assignment mismatch invalid time overlap and historical attendance restrictions", async ({
  page,
}) => {
  await enter(page)
  await nav(page, "Rosters & Attendance")
  await page.getByRole("button", { name: "Create shift", exact: true }).click()
  let d = page.getByRole("dialog", { name: "Create shift", exact: true })
  await d.getByLabel("Employee", { exact: true }).selectOption("s1")
  await d.getByLabel("House", { exact: true }).selectOption("h3")
  await d.getByRole("button", { name: "Publish shift", exact: true }).click()
  await expect(d).toContainText(
    "This employee is not currently assigned to the selected house.",
  )
  await d.getByLabel("House", { exact: true }).selectOption("h1")
  await d.getByLabel("Start", { exact: true }).fill("13:00")
  await d.getByLabel("End", { exact: true }).fill("15:00")
  await d.getByRole("button", { name: "Publish shift", exact: true }).click()
  await expect(d).toContainText("Overlaps an existing shift")
  await d.getByLabel("End", { exact: true }).fill("13:00")
  await d.getByRole("button", { name: "Publish shift", exact: true }).click()
  await expect(d).toContainText("equal times are not a shift")
  page.once("dialog", (d) => d.accept())
  await d.getByRole("button", { name: "Cancel", exact: true }).click()
  await page.getByRole("tab", { name: "Timesheets", exact: true }).click()
  const row = page
    .getByRole("row")
    .filter({ hasText: "Missing Clock-out" })
    .first()
  await row.getByRole("button", { name: "View details", exact: true }).click()
  await expect(
    page.getByRole("dialog", { name: "Attendance details", exact: true }),
  ).toContainText("Original clock-in")
  await page
    .getByRole("dialog", { name: "Attendance details", exact: true })
    .getByRole("button", { name: "Close", exact: true })
    .click()
  await page.getByRole("tab", { name: "Shift list", exact: true }).click()
  await expect(
    page.getByRole("columnheader", { name: "Shift status", exact: true }),
  ).toBeVisible()
  await page.getByLabel("Status", { exact: true }).selectOption("")
  await page.getByPlaceholder("Search employee or ID").fill("history-1")
  await page.getByRole("button", { name: "View", exact: true }).click()
  d = page.getByRole("dialog", { name: "Shift details", exact: true })
  await expect(d).toContainText("Recorded attendance exists")
  await expect(
    d.getByRole("button", { name: "Edit shift", exact: true }),
  ).toBeDisabled()
  await expect(
    d.getByRole("button", { name: "Cancel shift", exact: true }),
  ).toBeDisabled()
})
test("attendance review applies effective values retains originals and reaches Staff", async ({
  page,
}) => {
  await enter(page)
  await nav(page, "Rosters & Attendance")
  await page.getByRole("tab", { name: /Attendance corrections/ }).click()
  await page
    .getByRole("button", { name: "attendance-correction-1", exact: true })
    .click()
  let d = page.getByRole("dialog", {
    name: "Attendance correction review",
    exact: true,
  })
  await d.getByRole("button", { name: "Reject", exact: true }).click()
  await expect(d).toContainText("A rejection reason is required.")
  await d
    .getByLabel("Review notes", { exact: true })
    .fill("Reviewed fictional proposal")
  await d.getByRole("button", { name: "Approve", exact: true }).click()
  await page
    .getByRole("button", { name: "Confirm approval", exact: true })
    .click()
  await expect(d).toContainText("Approved")
  await expect(d).toContainText("Example Administrator")
  await d.getByRole("button", { name: "Close", exact: true }).click()
  await staff(page)
  await staffNav(page, "Roster & Timesheets")
  await page.getByRole("tab", { name: /My timesheets/ }).click()
  const row = page.locator('[data-timesheet-shift="history-2"]')
  await expect(row).toContainText("15:10")
  await expect(row).toContainText("Correction Approved · development decision")
  await row.getByRole("link", { name: /View details/ }).click()
  d = page.getByRole("dialog", { name: "Attendance details", exact: true })
  await expect(d).toContainText("Original events retained")
  await expect(d).toContainText("15:05")
  await expect(d).toContainText("Reviewed fictional proposal")
})
test("Staff correction submission appears in shared Admin review queue", async ({
  page,
}) => {
  await enter(page)
  await staff(page)
  await staffNav(page, "Roster & Timesheets")
  await page.getByRole("tab", { name: /My timesheets/ }).click()
  await page
    .locator('[data-timesheet-shift="history-1"]')
    .getByRole("link", { name: /View details/ })
    .click()
  await page
    .getByRole("link", { name: "Request correction", exact: true })
    .click()
  await page
    .getByLabel("Proposed clock-out", { exact: true })
    .fill("2026-10-20T15:00")
  await page
    .getByLabel(/Reason/)
    .fill("Shared Staff missing clock-out proposal")
  await page.getByRole("button", { name: /Submit request/ }).click()
  await expect(
    page.getByRole("dialog", { name: "Attendance details", exact: true }),
  ).toContainText("Shared Staff missing clock-out proposal")
  await backToAdmin(page)
  await nav(page, "Rosters & Attendance")
  await page.getByRole("tab", { name: /Attendance corrections/ }).click()
  await page
    .getByRole("row")
    .filter({ hasText: "Shared Staff missing clock-out proposal" })
    .click()
  const d = page.getByRole("dialog", {
    name: "Attendance correction review",
    exact: true,
  })
  await d.getByRole("button", { name: "Approve", exact: true }).click()
  await page
    .getByRole("button", { name: "Confirm approval", exact: true })
    .click()
  await expect(d).toContainText("Approved")
})
test("leave approval with conflicts leaves roster intact and Staff sees decision", async ({
  page,
}) => {
  await enter(page)
  await nav(page, "Leave Management")
  await page.getByRole("tab", { name: "All requests", exact: true }).click()
  await page
    .getByRole("button", { name: "Review leave-approved", exact: true })
    .click()
  let d = page.getByRole("dialog").first()
  await expect(d).toContainText("scheduled shift(s) overlap")
  await d.getByRole("button", { name: "Close", exact: true }).click()
  await page
    .getByRole("button", { name: "Review leave-pending", exact: true })
    .click()
  d = page.getByRole("dialog").first()
  await d
    .getByLabel("Review notes", { exact: true })
    .fill("Fictional leave decision visible to Staff")
  await d.getByRole("button", { name: "Approve", exact: true }).click()
  const confirm = page.getByRole("dialog", {
    name: "Approve leave?",
    exact: true,
  })
  await expect(confirm).toContainText("overlapping shift(s) remain unchanged")
  await confirm
    .getByRole("button", { name: "Confirm approval", exact: true })
    .click()
  await expect(d).toContainText("Approved")
  await d.getByRole("button", { name: "Close", exact: true }).click()
  await staff(page)
  await staffNav(page, "Leave")
  await page.locator('a[href="/leave?requestId=leave-pending"]').first().click()
  await expect(page.getByRole("dialog")).toContainText(
    "Fictional leave decision visible to Staff",
  )
  await expect(page.getByRole("dialog")).toContainText("Approved")
  await expect(
    page.getByRole("button", { name: /Cancel approved/ }),
  ).toHaveCount(0)
})
test("leave rejection requires reason and calendar excludes private reasons", async ({
  page,
}) => {
  await enter(page)
  await nav(page, "Leave Management")
  await page.getByRole("tab", { name: "All requests", exact: true }).click()
  await page.getByLabel("Status", { exact: true }).selectOption("Approved")
  await expect(
    page.getByRole("button", { name: "Review leave-approved", exact: true }),
  ).toBeVisible()
  await page.getByRole("tab", { name: "Pending requests", exact: true }).click()
  await expect(
    page.getByRole("button", { name: "Review leave-pending", exact: true }),
  ).toBeVisible()

  await page
    .getByRole("button", { name: "Review leave-pending", exact: true })
    .click()
  const d = page.getByRole("dialog").first()
  await d.getByRole("button", { name: "Reject", exact: true }).click()
  await expect(d).toContainText("A rejection reason is required.")
  await d
    .getByLabel("Review notes", { exact: true })
    .fill("Please coordinate another period")
  await d.getByRole("button", { name: "Reject", exact: true }).click()
  await page
    .getByRole("button", { name: "Confirm rejection", exact: true })
    .click()
  await expect(d).toContainText("Rejected")
  await d.getByRole("button", { name: "Close", exact: true }).click()
  await page.getByRole("tab", { name: "Leave calendar", exact: true }).click()
  await expect(page.locator(".ad-leave-calendar")).not.toContainText(
    "Private coworker leave example",
  )
  await expect(page.locator(".ad-leave-calendar")).not.toContainText(
    "Fictional upcoming absence",
  )
  await page.getByLabel("Status", { exact: true }).selectOption("")
  await page.getByLabel("Include Pending Review").check()
  await expect(page.locator(".ad-leave-entry").first()).toBeVisible()
})
test("calendar day week month filters navigation keyboard and deep link failure", async ({
  page,
}) => {
  await enter(page)
  await nav(page, "Rosters & Attendance")
  await page.getByRole("button", { name: "Month", exact: true }).click()
  await expect(page.locator(".ad-month-cell")).toHaveCount(42)
  await page
    .getByRole("button", { name: "Next date range", exact: true })
    .click()
  await page.getByRole("button", { name: "Today", exact: true }).click()
  await page.getByRole("button", { name: "Day", exact: true }).click()
  await expect(page.locator(".ad-day")).toBeVisible()
  await page.getByRole("button", { name: "Week", exact: true }).click()
  await page.getByLabel("House", { exact: true }).selectOption("h1")
  await expect(page.locator(".ad-week-house")).toHaveCount(1)
  await page
    .getByRole("button", { name: "Next date range", exact: true })
    .focus()
  await page.keyboard.press("Enter")
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true)
  for (const q of [
    "shiftId=missing",
    "attendanceId=missing",
    "correctionId=missing",
  ]) {
    expect((await page.goto(`/admin/roster?${q}`))?.status()).toBe(404)
  }
  expect((await page.goto("/admin/leave?requestId=missing"))?.status()).toBe(
    404,
  )
})

test("Staff leave submission is reviewed with real shared roster conflicts and no cancellation", async ({
  page,
}) => {
  await enter(page)
  await staff(page)
  await staffNav(page, "Leave")
  await page.getByRole("button", { name: "Request leave", exact: true }).click()
  let d = page.getByRole("dialog", { name: "Request leave", exact: true })
  await d.getByLabel("Start date", { exact: true }).fill("2026-10-23")
  await d.getByLabel("End date", { exact: true }).fill("2026-10-24")
  await d
    .getByLabel("Reason / notes", { exact: true })
    .fill("Shared leave roster conflict example")
  await d.getByRole("button", { name: "Submit request", exact: true }).click()
  await expect(page).toHaveURL(/requestId=/)
  const id = new URL(page.url()).searchParams.get("requestId")!
  await expect(page.getByRole("dialog")).toContainText(
    "Shared leave roster conflict example",
  )
  await backToAdmin(page)
  await nav(page, "Leave Management")
  await page.getByRole("button", { name: `Review ${id}`, exact: true }).click()
  d = page.getByRole("dialog").first()
  await expect(d).toContainText("scheduled shift(s) overlap")
  await d.getByRole("button", { name: "Approve", exact: true }).click()
  await expect(
    page.getByRole("dialog", { name: "Approve leave?", exact: true }),
  ).toContainText("overlapping shift(s) remain unchanged")
  await mkdir("test-results/phase-1e2", { recursive: true })
  await page.screenshot({
    path: `test-results/phase-1e2/${test.info().project.name}-migrated-leave-roster-conflict.png`,
    animations: "disabled",
  })
  await page
    .getByRole("button", { name: "Confirm approval", exact: true })
    .click()
  await expect(d).toContainText("Approved")
  await expect(d).toContainText("scheduled shift(s) overlap")
  await d
    .getByRole("link")
    .filter({ hasText: "Riverside Lodge" })
    .first()
    .click()
  await expect(
    page.getByRole("dialog", { name: "Shift details", exact: true }),
  ).toContainText("Scheduled")
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Close", exact: true })
    .click()
  await staff(page)
  await staffNav(page, "Leave")
  await page.locator(`a[href="/leave?requestId=${id}"]`).first().click()
  await expect(page.getByRole("dialog")).toContainText("Approved")
  await expect(page.getByRole("dialog")).toContainText("Example Administrator")
})
