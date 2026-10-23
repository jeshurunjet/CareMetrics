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
async function fillDates(page: Page, start = "2026-11-01", end = "2026-11-02") {
  await page.getByLabel("Start date", { exact: true }).fill(start)
  await page.getByLabel("End date", { exact: true }).fill(end)
}
test("dashboard, sidebar and mobile menu connect to own Leave overview", async ({
  page,
}) => {
  await page.goto("/dashboard")
  await page.getByRole("button", { name: "View leave", exact: true }).click()
  await expect(page).toHaveURL(/\/leave$/)
  await expect(
    page.getByRole("heading", { name: "Leave", exact: true }),
  ).toBeVisible()
  await expect(page.locator(".cm-stat-row")).toContainText("12.0")
  await expect(page.locator(".cm-stat-row")).toContainText("Approved requests")
  await expect(
    page.getByRole("region", { name: "Leave history" }),
  ).toContainText("Pending Review")
  await expect(
    page.getByText("Private coworker leave example", { exact: true }),
  ).toHaveCount(0)
  await page.reload()
  await expect(
    page.getByRole("heading", { name: "Leave", exact: true }),
  ).toBeVisible()
  if (page.viewportSize()!.width < 1024) {
    await page.getByRole("button", { name: "Menu", exact: true }).click()
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Leave", exact: true })
      .click()
  } else {
    await page
      .locator(".cm-sidebar-nav")
      .getByRole("button", { name: "Leave", exact: true })
      .click()
  }
  await bounds(page)
})
test("history search status type date filters and six-row pagination remain own and newest first", async ({
  page,
}) => {
  await page.goto("/leave")
  const history = page.getByRole("region", { name: "Leave history" })
  await expect(history.locator(".cm-leave-row")).toHaveCount(6)
  if (page.viewportSize()!.width <= 600) {
    const card = await history.locator(".cm-leave-row").first().boundingBox()
    const content = await history
      .locator(".cm-leave-row .cm-grow")
      .first()
      .boundingBox()
    expect(content!.width).toBeGreaterThan(card!.width * 0.7)
  }
  await expect(history.locator(".cm-leave-row").first()).toContainText(
    "awaiting review",
  )
  await page.getByRole("button", { name: "Next page", exact: true }).click()
  await expect(history.locator(".cm-leave-row")).toHaveCount(2)
  await page
    .getByLabel("Leave status", { exact: true })
    .selectOption("rejected")
  await expect(history.locator(".cm-leave-row")).toHaveCount(3)
  await page
    .getByLabel("History leave type", { exact: true })
    .selectOption("sick")
  await expect(history.locator(".cm-leave-row")).toHaveCount(2)
  await page.getByLabel("Leave status", { exact: true }).selectOption("")
  await page.getByLabel("History leave type", { exact: true }).selectOption("")
  await page
    .getByLabel("Leave history from", { exact: true })
    .fill("2026-10-24")
  await page.getByLabel("Leave history to", { exact: true }).fill("2026-10-24")
  await expect(history.locator(".cm-leave-row")).toHaveCount(1)
  await page
    .getByLabel("Search own leave requests", { exact: true })
    .fill("unmatched demonstration")
  await expect(
    history.getByText("No leave requests", { exact: true }),
  ).toBeVisible()
  await bounds(page)
})
test("request form validates required dates and reversed periods using configured leave types", async ({
  page,
}) => {
  await page.goto("/leave")
  await page.getByRole("button", { name: "Request leave", exact: true }).click()
  const dialog = page.getByRole("dialog")
  await expect(page.getByLabel("Employee", { exact: true })).toHaveValue(
    "Jamie Taufa",
  )
  await expect(page.getByLabel("Employee", { exact: true })).toHaveAttribute(
    "readonly",
    "",
  )
  await expect(
    page.getByLabel("Leave type", { exact: true }).locator("option"),
  ).toHaveCount(5)
  await dialog
    .getByRole("button", { name: "Submit request", exact: true })
    .click()
  await expect(
    dialog.getByText("Choose a valid start date.", { exact: true }),
  ).toBeVisible()
  await expect(
    dialog.getByText("Choose a valid end date.", { exact: true }),
  ).toBeVisible()
  await fillDates(page, "2026-11-02", "2026-11-01")
  await dialog
    .getByRole("button", { name: "Submit request", exact: true })
    .click()
  await expect(
    dialog.getByText("End date must be on or after the start date.", {
      exact: true,
    }),
  ).toBeVisible()
  await bounds(page)
})
test("overlap is advisory and roster links match shared shifts without editing them", async ({
  page,
}) => {
  await page.goto("/leave?action=new")
  await fillDates(page, "2026-10-23", "2026-10-24")
  const dialog = page.getByRole("dialog")
  await expect(dialog).toContainText("advisory warning; you may still submit")
  await expect(
    dialog.getByRole("region", { name: "Relevant roster context" }),
  ).toContainText("2 scheduled shifts")
  await expect(
    dialog.getByRole("link", { name: /Riverside Lodge/ }),
  ).toHaveAttribute("href", "/roster?shiftId=sh3")
  await dialog
    .getByRole("button", { name: "Submit request", exact: true })
    .click()
  await expect(page.getByRole("dialog")).toContainText(
    "Development request created",
  )
  await expect(page.getByRole("dialog")).toContainText("Pending Review")
})
test("submission stays session-only, appears in history, retains fictional balance and never sends requests", async ({
  page,
}) => {
  let writes = 0
  page.on("request", (r) => {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(r.method())) writes++
  })
  await page.goto("/leave?action=new")
  await fillDates(page)
  await page.getByLabel("Leave type", { exact: true }).selectOption("unpaid")
  await page
    .getByLabel("Reason / notes", { exact: true })
    .fill("New fictional leave request")
  await page
    .getByRole("button", { name: "Submit request", exact: true })
    .click()
  await expect(page.getByRole("dialog")).toContainText(
    "Development request created",
  )
  await expect(page.getByRole("dialog")).toContainText(
    "New fictional leave request",
  )
  const detailsUrl = page.url()
  await page.getByRole("button", { name: "Close", exact: true }).click()
  await expect(
    page
      .getByRole("region", { name: "Leave history" })
      .locator(".cm-leave-row")
      .first(),
  ).toContainText("New fictional leave request")
  await expect(page.locator(".cm-stat-row")).toContainText("12.0")
  await page.goto(detailsUrl)
  await expect(
    page.getByText("Leave request unavailable", { exact: true }),
  ).toBeVisible()
  expect(writes).toBe(0)
})
test("pending approved and rejected details retain correct decisions with no staff review or withdrawal", async ({
  page,
}) => {
  for (const [id, status] of [
    ["leave-pending", "Pending Review"],
    ["leave-approved", "Approved"],
    ["leave-rejected", "Rejected"],
  ]) {
    await page.goto(`/leave?requestId=${id}`)
    const dialog = page.getByRole("dialog")
    await expect(dialog).toContainText(status)
    await expect(dialog).toContainText(id)
    await expect(dialog).toContainText("Jamie Taufa")
    await expect(
      dialog.getByRole("button", { name: /approve|reject|cancel|withdraw/i }),
    ).toHaveCount(0)
    if (id !== "leave-pending") {
      await expect(dialog).toContainText("Mere Walker (demo)")
      await expect(dialog).toContainText("Management notes")
    }
    if (id === "leave-approved")
      await expect(dialog).toContainText(
        "Approved leave cannot be cancelled by staff",
      )
    if (id === "leave-rejected")
      await expect(dialog).toContainText("please discuss alternative dates")
  }
})
test("modal typing retains focus, Cancel/Escape prompts before discard and keyboard focus is contained", async ({
  page,
}) => {
  await page.goto("/leave?action=new")
  const notes = page.getByLabel("Reason / notes", { exact: true })
  await notes.pressSequentially("Fictional notes", { delay: 10 })
  await expect(notes).toHaveValue("Fictional notes")
  await expect(notes).toBeFocused()
  page.once("dialog", (d) => d.dismiss())
  await page.keyboard.press("Escape")
  await expect(notes).toHaveValue("Fictional notes")
  await page.getByRole("button", { name: "Close", exact: true }).focus()
  await page.keyboard.press("Shift+Tab")
  await expect(
    page.getByRole("button", { name: "Submit request", exact: true }),
  ).toBeFocused()
  page.once("dialog", (d) => d.accept())
  await page.getByRole("button", { name: "Cancel", exact: true }).click()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await expect(page).toHaveURL(/\/leave$/)
})
test("details support Back refresh and read-only roster navigation", async ({
  page,
}) => {
  await page.goto("/leave")
  await page
    .getByRole("region", { name: "Leave history" })
    .getByRole("link", {
      name: "View details for request leave-approved",
      exact: true,
    })
    .click()
  await expect(page.getByRole("dialog")).toContainText("Approved")
  await page.reload()
  await expect(page.getByRole("dialog")).toContainText("Approved")
  await page
    .getByRole("dialog")
    .getByRole("link", { name: /Sunrise House/ })
    .click()
  await expect(page).toHaveURL(/\/roster\?shiftId=sh2$/)
  await expect(page.getByRole("dialog")).toContainText("Sunrise House")
  await page.goBack()
  await expect(page.getByRole("dialog")).toHaveAccessibleName(
    "Leave request details",
  )
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await bounds(page)
})
test("unknown and other-employee IDs show generic unavailable without private content", async ({
  page,
}) => {
  for (const id of ["missing", "leave-other-employee", "leave-restricted"]) {
    await page.goto(`/leave?requestId=${id}`)
    await expect(
      page.getByText("Leave request unavailable", { exact: true }),
    ).toBeVisible()
    await expect(
      page.getByText("Private coworker leave example", { exact: true }),
    ).toHaveCount(0)
    await expect(
      page.getByText("Restricted leave history example", { exact: true }),
    ).toHaveCount(0)
  }
  for (const query of [
    "action=approve",
    "requestId=leave-pending&requestId=leave-approved",
    "action=new&requestId=leave-pending",
  ]) {
    const response = await page.goto(`/leave?${query}`)
    expect(response?.status()).toBe(404)
  }
})
test("capture Leave source comparisons and responsive details form and empty states", async ({
  page,
}, info) => {
  test.setTimeout(120000)
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  await mkdir("test-results/phase-1d2", { recursive: true })
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
      path: `test-results/phase-1d2/${info.project.name}-${name}.png`,
    })
  }
  await page.goto("/leave")
  await expect(page.locator(".cm-stat-row")).toContainText("12.0")
  await capture("migrated-overview")
  await capture("migrated-history", '[aria-label="Leave history"]')
  await page
    .getByLabel("Search own leave requests", { exact: true })
    .fill("unmatched demonstration")
  await expect(
    page
      .getByRole("region", { name: "Leave history" })
      .getByText("No leave requests", { exact: true }),
  ).toBeVisible()
  await capture("migrated-empty", '[aria-label="Leave history"]')
  for (const [id, state] of [
    ["leave-pending", "pending"],
    ["leave-approved", "approved"],
    ["leave-rejected", "rejected"],
  ]) {
    await page.goto(`/leave?requestId=${id}`)
    await expect(page.getByRole("dialog")).toBeVisible()
    await capture(`migrated-${state}`)
  }
  await page.goto("/leave?action=new")
  await expect(page.getByRole("dialog")).toBeVisible()
  await capture("migrated-new")
  await page
    .getByRole("button", { name: "Submit request", exact: true })
    .click()
  await capture("migrated-validation")
  await fillDates(page, "2026-10-23", "2026-10-24")
  await expect(page.getByRole("dialog")).toContainText("advisory warning")
  await capture("migrated-overlap", '.cm-modal-body [role="status"]')
  page.once("dialog", (d) => d.accept())
  await page.getByRole("button", { name: "Cancel", exact: true }).click()
  if (hasUiReference) {
    const original = async (empty = false) => {
      await page.goto(
        `http://localhost:8557${empty ? "?scenario=leave-empty" : ""}`,
      )
      await page
        .locator(".cm-sidebar-nav,.cm-drawer")
        .getByRole("button", { name: "Leave", exact: true })
        .filter({ visible: true })
        .count()
        .then(async (count) => {
          if (!count) {
            await page
              .getByRole("button", { name: "Menu", exact: true })
              .click()
          }
        })
      await page
        .locator(".cm-sidebar-nav,.cm-drawer")
        .getByRole("button", { name: "Leave", exact: true })
        .filter({ visible: true })
        .click()
    }
    await original()
    await expect(page.locator(".cm-leave-row")).toHaveCount(8)
    await capture("original-overview")
    await capture("original-history", ".cm-list")
    for (const [note, state] of [
      ["awaiting review", "pending"],
      ["upcoming absence", "approved"],
      ["rejected request", "rejected"],
    ]) {
      await page
        .locator(".cm-leave-row")
        .filter({ hasText: note })
        .first()
        .evaluate((el) => el.scrollIntoView({ block: "start" }))
      await capture(`original-${state}`)
    }
    await page
      .getByRole("button", { name: "Request leave", exact: true })
      .click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await capture("original-new")
    await page
      .getByRole("button", { name: "Submit request", exact: true })
      .click()
    await capture("original-validation")
    await page.locator("#lv-s").fill("2026-10-23")
    await page.locator("#lv-e").fill("2026-10-24")
    await capture("original-overlap")
    await original(true)
    await expect(
      page.getByText("No leave requests", { exact: true }),
    ).toBeVisible()
    await capture("original-empty", ".cm-empty")
  }
  expect(errors).toEqual([])
})
