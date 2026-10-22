import { test, expect, type Page } from "@playwright/test"
import { mkdir } from "node:fs/promises"
import { hasUiReference } from "../reference-availability"
const equipmentForm = "/clients/c1/records/new?templateId=t6"
const equipmentDetails =
  "/clients/c1?tab=charting&sub=t6&item=chart-equipment-1"
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
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
}
async function reason(page: Page) {
  await page
    .getByLabel("Reason for off-shift documentation", { exact: true })
    .fill("Fictional retrospective documentation")
}
async function fillRow(page: Page, n = 1) {
  await page
    .getByLabel(`Equipment name · Row ${n}`, { exact: true })
    .fill(`Fictional equipment ${n}`)
  await page
    .getByLabel(`Equipment type · Row ${n}`, { exact: true })
    .selectOption("Mobility")
  await page
    .getByLabel(`Date acquired · Row ${n}`, { exact: true })
    .fill("2025-01-01")
}
test("chart categories follow assignments and canonical navigation with empty state", async ({
  page,
}) => {
  await page.goto("/clients/c1")
  await page.getByRole("tab", { name: /Charting/ }).click()
  await expect(page.locator(".cm-category")).toHaveCount(3)
  await page
    .locator(".cm-category")
    .filter({ hasText: "Bowel Movement Chart" })
    .getByRole("link", { name: /View chart/ })
    .click()
  await expect(page).toHaveURL(/tab=charting&sub=t4$/)
  await expect(page.locator(".cm-chart-history tbody tr")).toHaveCount(6)
  await page.getByRole("link", { name: "All charts", exact: true }).click()
  await expect(page.locator(".cm-category")).toHaveCount(3)
  await expect(page).toHaveURL(/tab=charting$/)
  await page.goBack()
  await expect(page).toHaveURL(/sub=t4$/)
  await page.reload()
  await expect(page.locator(".cm-chart-history tbody tr")).toHaveCount(6)
  await page.goto("/clients/c2?tab=charting")
  await expect(page.locator(".cm-category")).toHaveCount(1)
  await page.goto("/clients/c3?tab=charting")
  await expect(
    page.getByText(
      "No charting categories are currently assigned to this client.",
      { exact: true },
    ),
  ).toBeVisible()
})
test("read-only history supports search date author pagination and numeric chart alternative", async ({
  page,
}) => {
  await page.goto("/clients/c1?tab=charting&sub=t4")
  await expect(
    page.locator(".cm-chart-history tbody tr").first(),
  ).toContainText("Type 1")
  await page.getByRole("button", { name: "Next page", exact: true }).click()
  await expect(page.locator(".cm-chart-history tbody tr")).toHaveCount(3)
  await page
    .getByLabel("Search chart records", { exact: true })
    .fill("observation 8")
  await expect(page.locator(".cm-chart-history tbody tr")).toHaveCount(1)
  await expect(page.locator(".cm-chart-history")).toContainText("Type 1")
  await page.getByLabel("Search chart records", { exact: true }).fill("")
  await page.getByLabel("Date range", { exact: true }).selectOption("1")
  await expect(page.locator(".cm-chart-history tbody tr")).toHaveCount(1)
  await page.getByLabel("Author", { exact: true }).selectOption("s1")
  await expect(page.getByText("No entries", { exact: true })).toBeVisible()
  await page.goto("/clients/c1?tab=charting&sub=t5")
  await expect(
    page.getByRole("img", { name: /Recorded minutes over time/ }),
  ).toBeVisible()
  await page
    .getByText("View chart data table (minutes)", { exact: true })
    .click()
  await expect(
    page
      .getByRole("region", { name: "Chart data alternative", exact: true })
      .locator("tbody tr"),
  ).toHaveCount(8)
  await expect(
    page.getByRole("region", { name: "Chart data alternative", exact: true }),
  ).toContainText("0")
  await page
    .getByLabel("Search chart records", { exact: true })
    .fill("no such example")
  await expect(
    page.getByText("No numeric submitted values to chart.", { exact: true }),
  ).toBeVisible()
  await noOverflow(page)
})
test("configured table adds removes rows with stable identity focus and max limit", async ({
  page,
}) => {
  await page.goto(equipmentForm)
  await expect(
    page.getByText("No rows added yet. Select Add Row to begin.", {
      exact: true,
    }),
  ).toBeVisible()
  await page.getByRole("button", { name: "Add Row", exact: true }).click()
  await expect(
    page.getByLabel("Equipment name · Row 1", { exact: true }),
  ).toBeFocused()
  await fillRow(page)
  const firstId = await page
    .locator("[data-table-row]")
    .first()
    .getAttribute("data-table-row")
  await page.getByRole("button", { name: "Add Row", exact: true }).click()
  await page
    .getByLabel("Equipment name · Row 2", { exact: true })
    .fill("Keep this row")
  const secondId = await page
    .locator("[data-table-row]")
    .nth(1)
    .getAttribute("data-table-row")
  expect(firstId).not.toBe(secondId)
  await page
    .getByRole("button", { name: "Remove draft row 1", exact: true })
    .click()
  await expect(
    page.getByLabel("Equipment name · Row 1", { exact: true }),
  ).toHaveValue("Keep this row")
  await expect(
    page.getByLabel("Equipment name · Row 1", { exact: true }),
  ).toBeFocused()
  expect(
    await page
      .locator("[data-table-row]")
      .first()
      .getAttribute("data-table-row"),
  ).toBe(secondId)
  for (let i = 0; i < 5; i++)
    await page.getByRole("button", { name: "Add Row", exact: true }).click()
  await expect(
    page.getByRole("button", { name: "Add Row", exact: true }),
  ).toBeDisabled()
  await expect(
    page.getByText("Maximum of 6 rows reached.", { exact: true }),
  ).toBeVisible()
  await noOverflow(page)
})
test("table validation off-shift submission and read-only rows work through shared form", async ({
  page,
}) => {
  await page.goto(equipmentForm)
  await page.getByRole("button", { name: "Submit entry", exact: true }).click()
  await expect(
    page.getByText("Add at least 1 row(s).", { exact: true }),
  ).toBeVisible()
  await page.getByRole("button", { name: "Add Row", exact: true }).click()
  await page.getByRole("button", { name: "Submit entry", exact: true }).click()
  await expect(
    page.getByText("Row 1, Equipment name: This field is required.", {
      exact: true,
    }),
  ).toBeVisible()
  await fillRow(page)
  await page.getByRole("button", { name: "Submit entry", exact: true }).click()
  await expect(
    page.getByLabel("Equipment name · Row 1", { exact: true }),
  ).toHaveAttribute("aria-invalid", "false")
  await expect(
    page.getByText("A reason is required when you are not clocked in.", {
      exact: true,
    }),
  ).toBeVisible()
  await reason(page)
  await page
    .getByLabel("Date and time observed", { exact: true })
    .fill("2026-10-22T12:00")
  await page.getByRole("button", { name: "Submit entry", exact: true }).click()
  await expect(
    page.getByText("Chart entry submitted in development preview", {
      exact: true,
    }),
  ).toBeVisible()
  await expect(
    page.getByRole("region", {
      name: "Equipment items submitted rows",
      exact: true,
    }),
  ).toContainText("Fictional equipment 1")
  await expect(
    page.getByRole("button", { name: /Remove draft row|Add Row|Save draft/ }),
  ).toHaveCount(0)
  const url = page.url()
  await page
    .getByRole("link", { name: "Back to chart history", exact: true })
    .click()
  await expect(
    page.locator(".cm-chart-history tbody tr").first(),
  ).toContainText("1 equipment rows")
  await page.goto(url)
  await expect(
    page.getByText("Chart entry unavailable", { exact: true }),
  ).toBeVisible()
})
test("incomplete draft rows resume with values and can submit without losing row IDs", async ({
  page,
}) => {
  await page.goto(equipmentForm)
  await page.getByRole("button", { name: "Add Row", exact: true }).click()
  await page
    .getByLabel("Equipment name · Row 1", { exact: true })
    .fill("Partial fictional item")
  const id = await page
    .locator("[data-table-row]")
    .getAttribute("data-table-row")
  await page.getByRole("button", { name: "Save draft", exact: true }).click()
  await page.getByRole("link", { name: "Continue draft", exact: true }).click()
  await expect(
    page.getByLabel("Equipment name · Row 1", { exact: true }),
  ).toHaveValue("Partial fictional item")
  expect(
    await page.locator("[data-table-row]").getAttribute("data-table-row"),
  ).toBe(id)
  await fillRow(page)
  await reason(page)
  await page.getByRole("button", { name: "Submit entry", exact: true }).click()
  await expect(
    page.getByText("Chart entry submitted in development preview", {
      exact: true,
    }),
  ).toBeVisible()
})
test("bowel and exercise forms render configuration and demo active attendance is shared", async ({
  page,
}) => {
  await page.goto("/clients/c1/records/new?templateId=t4")
  await expect(
    page.getByRole("group", { name: "Bristol stool reference", exact: true }),
  ).toBeVisible()
  await page
    .getByLabel("Stool type (Bristol)", { exact: true })
    .selectOption("Type 4")
  await page
    .getByRole("radiogroup", { name: "Size", exact: true })
    .getByRole("radio", { name: "Medium", exact: true })
    .click()
  await page
    .getByRole("radiogroup", { name: "Incontinence", exact: true })
    .getByRole("radio", { name: "No", exact: true })
    .click()
  await reason(page)
  await page.getByRole("button", { name: "Submit entry", exact: true }).click()
  await expect(
    page.getByText("Chart entry submitted in development preview", {
      exact: true,
    }),
  ).toBeVisible()
  await page.goto("/shift-check")
  await page.getByRole("button", { name: /Demo active attendance/ }).click()
  await page
    .getByRole("button", { name: "Continue to dashboard", exact: true })
    .first()
    .click()
  await page
    .locator(".cm-client-card")
    .filter({ hasText: "Taylor Reed" })
    .click()
  await page.getByRole("tab", { name: /Charting/ }).click()
  await page
    .locator(".cm-category")
    .filter({ hasText: "Exercise Chart" })
    .getByRole("link", { name: /Add entry/ })
    .click()
  await expect(page.getByText(/Demo active attendance · UI only/)).toBeVisible()
  await page
    .getByRole("radiogroup", { name: "Exercise setting", exact: true })
    .getByRole("radio", { name: "Home", exact: true })
    .click()
  await page
    .getByLabel("Exercise type", { exact: true })
    .selectOption("Walking")
  await page.getByLabel("Duration (minutes)", { exact: true }).fill("-1")
  await page.getByRole("button", { name: "Submit entry", exact: true }).click()
  await expect(
    page.getByText("Must be at least 0.", { exact: true }),
  ).toBeVisible()
  await page.getByLabel("Duration (minutes)", { exact: true }).fill("30")
  await page.getByRole("button", { name: "Submit entry", exact: true }).click()
  await expect(
    page.getByText("Chart entry submitted in development preview", {
      exact: true,
    }),
  ).toBeVisible()
})
test("versioned submitted tables and separate targeted corrections preserve originals", async ({
  page,
}) => {
  await page.goto("/clients/c1?tab=charting&sub=t6&item=chart-equipment-old")
  await expect(
    page.getByRole("columnheader", {
      name: "Original equipment name",
      exact: true,
    }),
  ).toBeVisible()
  await expect(
    page.getByRole("columnheader", { name: "Maintenance due", exact: true }),
  ).toHaveCount(0)
  await page.goto(equipmentDetails)
  await page
    .getByRole("link", { name: "Request correction", exact: true })
    .click()
  const target = JSON.stringify({
    fieldId: "equipment",
    rowId: "equipment-row-a",
    columnId: "serial",
  })
  await page
    .getByLabel("Affected field or table cell (optional)", { exact: true })
    .selectOption(target)
  await page
    .getByLabel("Reason for correction", { exact: true })
    .fill("Fictional serial typo")
  await page
    .getByLabel("Proposed correction", { exact: true })
    .fill("Serial number should be DEMO-103")
  await page
    .getByRole("button", { name: "Submit request", exact: true })
    .click()
  await expect(
    page.getByText("Correction pending review", { exact: true }).last(),
  ).toBeVisible()
  await expect(
    page.getByText(
      "Reference: field equipment · row equipment-row-a · column serial",
      { exact: true },
    ),
  ).toBeVisible()
  await expect(
    page.getByRole("region", {
      name: "Equipment items submitted rows",
      exact: true,
    }),
  ).toContainText("DEMO-101")
  await expect(
    page.getByRole("button", { name: /Approve|Reject|Remove draft row/ }),
  ).toHaveCount(0)
  await noOverflow(page)
})
test("invalid unassigned and wrong-client IDs never expose chart content", async ({
  page,
}) => {
  for (const url of [
    "/clients/c4?tab=charting",
    "/clients/c2?tab=charting&sub=t6",
    "/clients/c1?tab=charting&sub=t1",
    "/clients/c1/records/new?templateId=chart-private",
    "/clients/c1?tab=charting&sub=unknown",
  ]) {
    expect((await page.goto(url))?.status()).toBe(404)
    await expect(
      page.getByText("Unassigned chart content", { exact: true }),
    ).toHaveCount(0)
  }
  for (const url of [
    "/clients/c1?tab=charting&sub=t4&item=chart-c2-bowel",
    "/clients/c1?tab=charting&sub=t6&item=chart-bowel-1",
    "/clients/c1?tab=charting&sub=t6&item=missing",
    "/clients/c1/records/new?templateId=t6&draft=chart-private-draft",
    "/clients/c1/records/new?templateId=t6&draft=chart-equipment-1",
  ]) {
    await page.goto(url)
    await expect(
      page.getByText("Chart entry unavailable", { exact: true }),
    ).toBeVisible()
    await expect(
      page.getByText("Different client's fictional chart", { exact: true }),
    ).toHaveCount(0)
  }
})
test("unsaved table changes require confirmation and cancellation preserves rows", async ({
  page,
}) => {
  await page.goto(equipmentForm)
  await page.getByRole("button", { name: "Add Row", exact: true }).click()
  await fillRow(page)
  await page.getByRole("button", { name: "Cancel", exact: true }).click()
  await page.getByRole("button", { name: "Keep editing", exact: true }).click()
  await expect(
    page.getByLabel("Equipment name · Row 1", { exact: true }),
  ).toHaveValue("Fictional equipment 1")
  page.once("dialog", (dialog) => dialog.dismiss())
  await page.getByRole("button", { name: "Taylor Reed", exact: true }).click()
  await expect(page).toHaveURL(/records\/new/)
  await page.getByRole("button", { name: "Cancel", exact: true }).click()
  await page.getByRole("button", { name: "Discard", exact: true }).click()
  await expect(page).toHaveURL(/tab=charting&sub=t6$/)
})
test("capture Charting source comparisons and responsive table states", async ({
  page,
}, info) => {
  test.setTimeout(90000)
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  await mkdir("test-results/phase-1c3", { recursive: true })
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
    if (name.startsWith("migrated-")) await noOverflow(page)
    await page.screenshot({
      animations: "disabled",
      style: "nextjs-portal{display:none!important}",
      path: `test-results/phase-1c3/${info.project.name}-${name}.png`,
    })
  }
  await page.goto("/clients/c1?tab=charting")
  await expect(page.locator(".cm-category")).toHaveCount(3)
  await capture("migrated-categories", ".cm-category-grid")
  await page.goto("/clients/c1?tab=charting&sub=t4")
  await expect(page.locator(".cm-chart-history tbody tr")).toHaveCount(6)
  await capture("migrated-history", ".cm-toolbar")
  await page.goto("/clients/c1?tab=charting&sub=t5")
  await capture("migrated-chart", ".cm-panel")
  await page.goto(equipmentForm)
  await capture("migrated-new")
  await page.getByRole("button", { name: "Add Row", exact: true }).click()
  await fillRow(page)
  await page
    .getByLabel("Condition / notes · Row 1", { exact: true })
    .fill(
      "Fictional long observation for responsive table review, preserving every value without page-level overflow.",
    )
  await page.getByRole("button", { name: "Add Row", exact: true }).click()
  await fillRow(page, 2)
  await capture("migrated-table", ".cm-configured-table")
  await page.getByLabel("Date acquired · Row 2", { exact: true }).fill("")
  await page.getByRole("button", { name: "Submit entry", exact: true }).click()
  await expect(
    page.getByText("Row 2, Date acquired: This field is required.", {
      exact: true,
    }),
  ).toBeVisible()
  await capture("migrated-validation", ".cm-configured-table .cm-field--error")
  for (const button of await page.locator(".cm-form-actions button").all()) {
    const box = await button.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(
      info.project.use.viewport!.width,
    )
  }
  page.once("dialog", (d) => d.accept())
  await page.goto(`${equipmentForm}&draft=chart-equipment-draft`)
  await capture("migrated-draft", ".cm-configured-table")
  page.once("dialog", (d) => d.accept())
  await page.goto(equipmentDetails)
  await capture("migrated-submitted", ".cm-panel")
  const region = page.getByRole("region", {
    name: "Equipment items submitted rows",
    exact: true,
  })
  await region.evaluate((el) => {
    el.scrollLeft = el.scrollWidth
  })
  await expect(
    region.getByRole("cell", {
      name: "Fictional example; good condition",
      exact: true,
    }),
  ).toBeVisible()
  await page
    .getByRole("link", { name: "Request correction", exact: true })
    .click()
  await capture("migrated-correction", "[data-diary-editor]")
  if (hasUiReference) {
    await page.goto("http://localhost:8557")
    await page
      .getByRole("button", { name: "Houses", exact: true })
      .filter({ visible: true })
      .click()
    await page.locator(".cm-house-card").first().click()
    await page
      .locator(".cm-client-card")
      .filter({ hasText: "Taylor Reed" })
      .click()
    await page.getByRole("tab", { name: /Charting/ }).click()
    await expect(page.locator(".cm-category")).toHaveCount(3)
    await capture("original-categories", ".cm-category-grid")
    await page
      .locator(".cm-category")
      .filter({ hasText: "Bowel Movement Chart" })
      .click()
    await capture("original-history", ".cm-toolbar")
    await page.getByRole("button", { name: "All charts", exact: true }).click()
    await page
      .locator(".cm-category")
      .filter({ hasText: "Exercise Chart" })
      .click()
    await capture("original-chart", ".cm-panel")
    await page.getByRole("button", { name: "All charts", exact: true }).click()
    await page
      .locator(".cm-category")
      .filter({ hasText: "Equipment Register" })
      .click()
    await page.getByRole("button", { name: "Add entry", exact: true }).click()
    await capture("original-new")
    await page.getByRole("button", { name: "Add row", exact: true }).click()
    let rows = page.locator(".cm-repeat-row")
    await rows
      .first()
      .getByLabel("Equipment name", { exact: false })
      .fill("Fictional equipment 1")
    await rows
      .first()
      .getByLabel("Equipment type", { exact: false })
      .selectOption("Mobility")
    await rows
      .first()
      .getByLabel("Date acquired", { exact: false })
      .fill("2025-01-01")
    await rows
      .first()
      .getByLabel("Condition / notes", { exact: false })
      .fill(
        "Fictional long observation for responsive table review, preserving every value without page-level overflow.",
      )
    await page.getByRole("button", { name: "Add row", exact: true }).click()
    rows = page.locator(".cm-repeat-row")
    await rows
      .nth(1)
      .getByLabel("Equipment name", { exact: false })
      .fill("Fictional equipment 2")
    await rows
      .nth(1)
      .getByLabel("Equipment type", { exact: false })
      .selectOption("Mobility")
    await rows
      .nth(1)
      .getByLabel("Date acquired", { exact: false })
      .fill("2025-01-01")
    await capture("original-table", ".cm-repeat")
    await rows.nth(1).getByLabel("Date acquired", { exact: false }).fill("")
    await page.getByRole("button", { name: "Submit", exact: true }).click()
    await capture("original-validation", ".cm-repeat-row:nth-child(2)")
    await expect(page.locator(".cm-toast")).toHaveCount(0)
    await page.getByRole("button", { name: "Cancel", exact: true }).click()
    await page.getByRole("button", { name: "Discard", exact: true }).click()
    await page.locator(".cm-table tbody tr").first().click()
    await page
      .getByRole("button", { name: "Continue draft", exact: true })
      .click()
    await capture("original-draft", ".cm-repeat")
    await page.getByRole("button", { name: "Cancel", exact: true }).click()
    await page.getByRole("button", { name: "Discard", exact: true }).click()
    await page.locator(".cm-table tbody tr").nth(1).click()
    await capture("original-submitted", ".cm-modal")
    await page
      .getByRole("button", { name: "Request correction", exact: true })
      .click()
    await capture("original-correction")
  }
  expect(errors).toEqual([])
})
