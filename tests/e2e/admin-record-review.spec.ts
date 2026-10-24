import { test, expect } from "@playwright/test"
import {
  setup,
  enter,
  tab,
  bounds,
  create,
  section,
  field,
  publish,
  assign,
  staffClient,
  backToAdmin,
} from "./documentation-helpers"
import { staffRecord, request, review, decide } from "./record-review-helpers"
test.use({ timezoneId: "Pacific/Auckland" })
test.beforeEach(async ({ page }) => setup(page))
test("record review desktop notice and fail-closed direct routes", async ({
  page,
}) => {
  await page.goto("/admin/documentation?tab=records")
  const narrow = page.viewportSize()!.width < 1024
  await expect(page.locator(".ad-desktop-guard")).toBeVisible({
    visible: narrow,
  })
  if (!narrow)
    await expect(
      page.getByText(
        "Staff and Senior Staff cannot use Admin management screens or mutations.",
        { exact: true },
      ),
    ).toBeVisible()
  for (const path of [
    "/admin/documentation/records/client-c1-1",
    "/admin/documentation/records/client-c1-1?kind=other",
    "/admin/documentation/records/client-c1-1?kind=diary&kind=care",
    "/admin/documentation/corrections/chart-correction?action=approve",
  ]) {
    expect((await page.goto(path))?.status()).toBe(404)
  }
})
test("four record lists support filters search dates sorting pagination and read-only details", async ({
  page,
}) => {
  test.skip(page.viewportSize()!.width < 1024, "Desktop management")
  await enter(page)
  await tab(page, "Submitted records")
  await expect(
    page.getByRole("button", { name: /Total submitted records/ }),
  ).toBeVisible()
  expect(await page.locator("tbody tr").count()).toBe(12)
  await page.getByRole("button", { name: "Next page", exact: true }).click()
  await expect(page.locator(".cm-pagination")).toContainText("13–")
  await page
    .getByLabel("Record type", { exact: true })
    .selectOption("House Diary")
  await expect(page.locator("tbody")).toContainText("House Diary")
  await expect(page.locator("tbody")).not.toContainText("Client Diary")
  await page
    .getByLabel("Search submitted records", { exact: true })
    .fill("House handover 1")
  await expect(page.locator("tbody tr")).toHaveCount(3)
  await page.getByLabel("House", { exact: true }).selectOption("h1")
  await expect(page.locator("tbody tr")).toHaveCount(1)
  await page.getByLabel("From", { exact: true }).fill("2026-10-23")
  await expect(page.getByText("No records", { exact: true })).toBeVisible()
  await page.getByLabel("From", { exact: true }).fill("")
  await page
    .getByRole("columnheader", { name: "Covered", exact: true })
    .getByRole("button")
    .click()
  await page.getByRole("link", { name: /View details house-h1-1/ }).click()
  await expect(page.locator(".ad-content")).toContainText("Operational Update")
  await expect(
    page.getByRole("button", {
      name: "Controlled removal · unavailable",
      exact: true,
    }),
  ).toBeDisabled()
  await expect(
    page.getByRole("button", { name: /Delete|Edit record/ }),
  ).toHaveCount(0)
  await bounds(page)
})
test("Staff Client Diary approval creates an effective revision and preserves original history", async ({
  page,
}) => {
  test.skip(page.viewportSize()!.width < 1024, "Desktop management")
  await enter(page)
  await staffRecord(page, "diary", "client-c1-1")
  await page.clock.setFixedTime(new Date("2026-10-22T01:01:00.000Z"))
  await request(
    page,
    "Review Client Diary wording",
    "Approved fictional replacement diary body.",
  )
  await page.clock.setFixedTime(new Date("2026-10-22T01:02:00.000Z"))
  await review(page, "Review Client Diary wording")
  await expect(page.locator(".ad-compare")).toContainText(
    "Fictional diary note for interface review",
  )
  await expect(page.locator(".ad-compare ins")).toContainText(
    "Approved fictional replacement",
  )
  await decide(page, "Approve", "Confirmed against original narrative")
  await page.getByRole("link", { name: "Open record", exact: true }).click()
  await expect(
    page
      .getByText("Approved fictional replacement diary body.", { exact: true })
      .first(),
  ).toBeVisible()
  await page
    .getByRole("button", { name: "View Original Record", exact: true })
    .click()
  await expect(page.locator(".ad-content")).toContainText(
    "The planned activity was discussed",
  )
  await staffRecord(page, "diary", "client-c1-1")
  await expect(
    page.getByRole("heading", { name: "Correction approved", exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole("region", { name: "Record revision history" }),
  ).toContainText("Example Administrator")
  await expect(page.locator(".cm-diary-text").first()).toHaveText(
    "Approved fictional replacement diary body.",
  )
  await page.getByText("View original submission", { exact: true }).click()
  await expect(
    page.getByRole("region", { name: "Record revision history" }),
  ).toContainText("The planned activity was discussed")
  await expect(
    page.getByRole("button", { name: /Approve|Reject/ }),
  ).toHaveCount(0)
})
test("House Diary rejection requires reason and leaves original content unchanged", async ({
  page,
}) => {
  test.skip(page.viewportSize()!.width < 1024, "Desktop management")
  await enter(page)
  await page.locator(".ad-account").click()
  await page
    .getByRole("link", { name: "View Staff application", exact: true })
    .click()
  await page
    .locator(".cm-sidebar")
    .getByRole("button", { name: "Houses", exact: true })
    .click()
  await page
    .locator(".cm-house-card")
    .filter({ hasText: "Riverside Lodge" })
    .click()
  await page.getByRole("tab", { name: /House diary/ }).click()
  await page.locator('a[href="/houses/h1?tab=diary&item=house-h1-1"]').click()
  await request(
    page,
    "Review House Diary wording",
    "Proposed operational note for rejection.",
  )
  await review(page, "Review House Diary wording")
  await page.getByRole("button", { name: "Reject", exact: true }).click()
  await expect(
    page.getByText("Enter a rejection reason.", { exact: true }),
  ).toBeVisible()
  await decide(page, "Reject", "Original operational note is accurate")
  await page.getByRole("link", { name: "Open record", exact: true }).click()
  await expect(page.locator(".ad-content")).toContainText(
    "Shared spaces were checked",
  )
  await expect(page.locator(".ad-content")).toContainText(
    "Original operational note is accurate",
  )
  await page.locator(".ad-account").click()
  await page
    .getByRole("link", { name: "View Staff application", exact: true })
    .click()
  await page
    .locator(".cm-sidebar")
    .getByRole("button", { name: "Houses", exact: true })
    .click()
  await page
    .locator(".cm-house-card")
    .filter({ hasText: "Riverside Lodge" })
    .click()
  await page.getByRole("tab", { name: "House diary", exact: true }).click()
  await page.locator('a[href="/houses/h1?tab=diary&item=house-h1-1"]').click()
  await expect(
    page.getByRole("heading", { name: "Correction rejected", exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole("region", { name: "Record revision history" }),
  ).toContainText("Original operational note is accurate")
  await expect(page.locator(".cm-diary-text").first()).toContainText(
    "Shared spaces were checked",
  )
})
test("historical assessment correction validates v1 field despite published v2", async ({
  page,
}) => {
  test.skip(page.viewportSize()!.width < 1024, "Desktop management")
  await enter(page)
  await staffRecord(page, "care", "care-c1-skin-7")
  await request(
    page,
    "Review v1 assessment answer",
    "Replace the original v1 text answer.",
    "Original skin condition",
    "Revised fictional v1 observation",
  )
  await review(page, "Review v1 assessment answer")
  await expect(page.locator(".ad-compare")).toContainText("v1")
  await expect(
    page.getByRole("region", { name: "Affected fields" }),
  ).toContainText("condition")
  await decide(page, "Approve")
  await staffRecord(page, "care", "care-c1-skin-7")
  await expect(
    page.getByRole("heading", { name: "Correction approved", exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText("Revised fictional v1 observation", { exact: true }).first(),
  ).toBeVisible()
  await page.getByText("View original submission", { exact: true }).click()
  await expect(
    page.getByText("Legacy fictional observation", { exact: true }),
  ).toBeVisible()
})
test("table-cell correction uses stable IDs and retains original rows and columns", async ({
  page,
}) => {
  test.skip(page.viewportSize()!.width < 1024, "Desktop management")
  await enter(page)
  await staffRecord(page, "chart", "chart-equipment-1", "t6")
  await request(
    page,
    "Review equipment serial cell",
    "Serial number is REVISED-103.",
    "Equipment items · Row 1 · Serial number",
    "REVISED-103",
  )
  await review(page, "Review equipment serial cell")
  await expect(page.locator(".ad-compare")).toContainText("equipment-row-a")
  await expect(page.locator(".ad-compare")).toContainText("DEMO-101")
  await decide(page, "Approve")
  await staffRecord(page, "chart", "chart-equipment-1", "t6")
  const table = page
    .getByRole("region", {
      name: "Equipment items submitted rows",
      exact: true,
    })
    .first()
  await expect(table).toContainText("REVISED-103")
  await expect(table).toContainText("DEMO-102")
  await page.getByText("View original submission", { exact: true }).click()
  await expect(
    page.getByRole("region", { name: "Record revision history" }),
  ).toContainText("DEMO-101")
})
test("legacy structured request blocks approval; Manager can reject and Staff/Senior stay restricted", async ({
  page,
}) => {
  test.skip(page.viewportSize()!.width < 1024, "Desktop management")
  await enter(page)
  await tab(page, "Correction requests")
  await page
    .getByRole("row")
    .filter({ hasText: "Fictional duration wording review" })
    .getByRole("link", { name: /View request/ })
    .click()
  await expect(
    page.getByRole("button", { name: "Approve", exact: true }),
  ).toBeDisabled()
  await page.locator(".ad-account").click()
  await page
    .getByLabel("Preview role · no trusted session", { exact: true })
    .selectOption("Manager")
  await page.locator(".ad-account").click()
  await decide(page, "Reject", "Please submit a typed proposed answer")
  for (const role of ["Staff", "Senior Staff"]) {
    await page.locator(".ad-account").click()
    await page
      .getByLabel("Preview role · no trusted session", { exact: true })
      .selectOption(role)
    await page.locator(".ad-account").click()
    await expect(
      page.getByText(
        "Staff and Senior Staff cannot use Admin management screens or mutations.",
        { exact: true },
      ),
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Approve", exact: true }),
    ).toHaveCount(0)
  }
})

test("new assessment correction retains v1 definitions after management publishes v2", async ({
  page,
}) => {
  test.skip(page.viewportSize()!.width < 1024, "Desktop management")
  await enter(page)
  const template = await create(
    page,
    "care",
    "Fictional record-review assessment",
  )
  await section(page)
  await field(page, "Short Text", "Original configured finding")
  await publish(page)
  await assign(page)
  await staffClient(page)
  await page
    .locator(".cm-category")
    .filter({ hasText: "Fictional record-review assessment" })
    .getByRole("link", { name: /Add entry/ })
    .click()
  await page
    .getByLabel("Original configured finding", { exact: true })
    .fill("Original fictional finding")
  await page
    .getByLabel("Reason for off-shift documentation", { exact: true })
    .fill("Example handover")
  await page
    .getByRole("button", { name: "Submit assessment", exact: true })
    .click()
  await expect(page.getByText(/Template v1 · Taylor Reed/)).toBeVisible()
  const id = new URL(page.url()).searchParams.get("item")!
  await backToAdmin(page)
  await tab(page, "Form builder")
  await page
    .getByRole("button", { name: "Create New Version", exact: true })
    .click()
  await page
    .locator(".ad-outline-select")
    .filter({ hasText: "Original configured finding" })
    .click()
  await page
    .getByLabel("Field label", { exact: true })
    .fill("Version two finding")
  await page.getByRole("button", { name: "Save Draft", exact: true }).click()
  await publish(page, 2)
  await staffRecord(page, "care", id, template)
  await request(
    page,
    "New assessment v1 correction",
    "Replace original configured finding.",
    "Original configured finding",
    "Corrected original-version finding",
  )
  await review(page, "New assessment v1 correction")
  await expect(
    page.getByRole("region", { name: "Affected fields" }),
  ).toContainText("Original configured finding")
  await expect(page.locator(".ad-compare")).not.toContainText(
    "Version two finding",
  )
  await decide(page, "Approve")
  await staffRecord(page, "care", id, template)
  await expect(
    page
      .getByText("Corrected original-version finding", { exact: true })
      .first(),
  ).toBeVisible()
  await page.getByText("View original submission", { exact: true }).click()
  await expect(
    page.getByText("Original fictional finding", { exact: true }),
  ).toBeVisible()
})
test("new multirow Charting submission receives a stable-cell correction", async ({
  page,
}) => {
  test.skip(page.viewportSize()!.width < 1024, "Desktop management")
  await enter(page)
  const template = await create(
    page,
    "chart",
    "Fictional review equipment table",
  )
  await section(page)
  await field(page, "Short Text", "Register reference")
  await field(page, "Repeating Editable Table", "Equipment rows")
  await page.getByRole("button", { name: "Add column", exact: true }).click()
  await page.getByLabel("Column 1 label", { exact: true }).fill("Serial")
  await publish(page)
  await assign(page)
  await staffClient(page, "chart")
  await page
    .locator(".cm-category")
    .filter({ hasText: "Fictional review equipment table" })
    .getByRole("link", { name: /Add entry/ })
    .click()
  await page
    .getByLabel("Register reference", { exact: true })
    .fill("REVIEW-EXAMPLE")
  for (const i of [1, 2]) {
    await page.getByRole("button", { name: "Add Row", exact: true }).click()
    await page
      .getByLabel(`Serial · Row ${i}`, { exact: true })
      .fill(`ORIGINAL-${i}`)
  }
  await page
    .getByLabel("Reason for off-shift documentation", { exact: true })
    .fill("Example handover")
  await page.getByRole("button", { name: "Submit entry", exact: true }).click()
  await expect(page.getByText(/Template v1 · Taylor Reed/)).toBeVisible()
  const recordId = new URL(page.url()).searchParams.get("item")!
  await request(
    page,
    "New multirow cell correction",
    "Replace the first serial only.",
    "Equipment rows · Row 1 · Serial",
    "CORRECTED-1",
  )
  await review(page, "New multirow cell correction")
  await decide(page, "Approve")
  await page.getByRole("link", { name: "Open record", exact: true }).click()
  await expect(
    page
      .getByRole("region", {
        name: "Equipment rows submitted rows",
        exact: true,
      })
      .first(),
  ).toContainText("CORRECTED-1")
  await expect(
    page
      .getByRole("region", {
        name: "Equipment rows submitted rows",
        exact: true,
      })
      .first(),
  ).toContainText("ORIGINAL-2")
  await page.getByText("View original submission", { exact: true }).click()
  await expect(
    page.getByRole("region", { name: "Record revision history" }),
  ).toContainText("ORIGINAL-1")
  await staffRecord(page, "chart", recordId, template)
  await page
    .getByRole("link", { name: "Request correction", exact: true })
    .click()
  await page
    .getByLabel("Affected field or table cell (optional)", { exact: true })
    .selectOption({ label: "Equipment rows · Whole table (stable rows)" })
  await page
    .getByRole("checkbox", { name: "Apply a structured value", exact: true })
    .check()
  await expect(page.getByLabel("Serial · Row 1", { exact: true })).toHaveValue(
    "CORRECTED-1",
  )
  await page
    .getByRole("button", { name: "Remove draft row 2", exact: true })
    .click()
  await page.getByRole("button", { name: "Add Row", exact: true }).click()
  await page.getByLabel("Serial · Row 2", { exact: true }).fill("ADDED-3")
  await page
    .getByLabel("Reason for correction", { exact: true })
    .fill("Explicit row replacement")
  await page
    .getByLabel("Proposed correction", { exact: true })
    .fill("Retain first row, remove second and add a new stable row.")
  await page
    .getByRole("button", { name: "Submit request", exact: true })
    .click()
  await expect(
    page.getByRole("heading", {
      name: "Correction pending review",
      exact: true,
    }),
  ).toBeVisible()
  await review(page, "Explicit row replacement")
  await expect(
    page.getByRole("region", {
      name: "Proposed table differences",
      exact: true,
    }),
  ).toContainText("Added row")
  await expect(
    page.getByRole("region", {
      name: "Proposed table differences",
      exact: true,
    }),
  ).toContainText("Removed row")
  await decide(page, "Approve")
  await page.getByRole("link", { name: "Open record", exact: true }).click()
  await expect(
    page
      .getByRole("region", {
        name: "Equipment rows submitted rows",
        exact: true,
      })
      .first(),
  ).toContainText("ADDED-3")
})
