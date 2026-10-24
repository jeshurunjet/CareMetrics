import { test, expect } from "@playwright/test"
import {
  setup,
  enter,
  tab,
  create,
  section,
  field,
  publish,
  assign,
  staffClient,
  backToAdmin,
  bounds,
  captureStaff,
} from "./documentation-helpers"
test.use({ timezoneId: "Pacific/Auckland" })
test.beforeEach(async ({ page }) => setup(page))
test("documentation desktop gate, restricted direct entry and malformed queries", async ({
  page,
}) => {
  await page.goto("/admin/documentation")
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
  for (const url of [
    "/admin/documentation?tab=invalid",
    "/admin/documentation?tab=care&tab=chart",
    "/admin/documentation/templates/t1?tab=delete",
    "/admin/documentation/templates/t1?version=999",
  ])
    expect((await page.goto(url))?.status()).toBe(404)
})
test("Admin-created Care Plan publishes, assigns, submits through Staff and retains v1 after v2", async ({
  page,
}, info) => {
  test.skip(
    page.viewportSize()!.width < 1024,
    "Management remains desktop-only",
  )
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  await enter(page)
  await create(page, "care", "Fictional configured Care Plan")
  await section(page)
  await field(page, "Dropdown", "Observation setting")
  await page.getByLabel("Option 1 label", { exact: true }).fill("Indoor")
  await page.getByLabel("Option 1 stable value", { exact: true }).fill("indoor")
  await page.getByRole("button", { name: "Add option", exact: true }).click()
  await page.getByLabel("Option 2 label", { exact: true }).fill("Outdoor")
  await page
    .getByLabel("Option 2 stable value", { exact: true })
    .fill("outdoor")
  await page.getByLabel("Default value", { exact: true }).selectOption("indoor")
  await page.getByLabel("Required question", { exact: true }).check()
  await field(page, "Long Text", "Configured observations")
  await page.getByLabel("Required question", { exact: true }).check()
  await page
    .getByLabel("Show only when a condition matches", { exact: true })
    .check()
  await page
    .getByLabel("Condition source", { exact: true })
    .selectOption({ label: "Observation setting" })
  await page
    .getByLabel("Expected value", { exact: true })
    .selectOption("indoor")
  await expect(
    page
      .locator(".ad-preview-frame")
      .getByLabel("Configured observations", { exact: true }),
  ).toBeVisible()
  await page
    .locator(".ad-preview-frame")
    .getByLabel("Observation setting", { exact: true })
    .selectOption("outdoor")
  await expect(
    page
      .locator(".ad-preview-frame")
      .getByLabel("Configured observations", { exact: true }),
  ).toHaveCount(0)
  await page.getByRole("button", { name: "Save Draft", exact: true }).click()
  await publish(page)
  await assign(page)
  await staffClient(page)
  const category = page
    .locator(".cm-category")
    .filter({ hasText: "Fictional configured Care Plan" })
  await expect(category).toContainText("Template v1")
  await category.getByRole("link", { name: /Add entry/ }).click()
  await page
    .getByLabel("Configured observations", { exact: true })
    .fill("Fictional Staff observation under original configuration")
  await page
    .getByLabel("Reason for off-shift documentation", { exact: true })
    .fill("Example handover")
  await captureStaff(page, info.project.name, "staff-care")
  await page
    .getByRole("button", { name: "Submit assessment", exact: true })
    .click()
  await expect(page.getByText(/Template v1 · Taylor Reed/)).toBeVisible()
  await expect(
    page.getByText("Fictional Staff observation under original configuration", {
      exact: true,
    }),
  ).toBeVisible()
  await captureStaff(page, info.project.name, "staff-care-record")
  await backToAdmin(page)
  await tab(page, "Form builder")
  await page
    .getByRole("button", { name: "Create New Version", exact: true })
    .click()
  await page
    .locator(".ad-palette .ad-outline-select")
    .filter({ hasText: "Configured observations" })
    .click()
  await page
    .getByLabel("Field label", { exact: true })
    .fill("New version observations")
  await page.getByRole("button", { name: "Save Draft", exact: true }).click()
  await publish(page, 2)
  await tab(page, "Assign to clients")
  const row = page.getByRole("row").filter({ hasText: "Taylor Reed" })
  await expect(row).toContainText("v1")
  await row.getByRole("button", { name: "Update to v2", exact: true }).click()
  await page
    .getByRole("button", { name: "Confirm version update", exact: true })
    .click()
  await staffClient(page)
  const current = page
    .locator(".cm-category")
    .filter({ hasText: "Fictional configured Care Plan" })
  await expect(current).toContainText("Template v2")
  await current.getByRole("link", { name: /View records/ }).click()
  if (
    (await page
      .locator(".cm-history-head")
      .first()
      .getAttribute("aria-expanded")) === "false"
  )
    await page.locator(".cm-history-head").first().click()
  await expect(
    page.getByText("Configured observations", { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText("New version observations", { exact: true }),
  ).toHaveCount(0)
  await expect(
    page.getByText("Fictional Staff observation under original configuration", {
      exact: true,
    }),
  ).toBeVisible()
  await bounds(page)
  expect(errors).toEqual([])
})
test("Admin-created Charting table config submits and reads original columns in Staff", async ({
  page,
}, info) => {
  test.skip(
    page.viewportSize()!.width < 1024,
    "Management remains desktop-only",
  )
  await enter(page)
  await create(page, "chart", "Fictional configured Equipment Register")
  await section(page, "Equipment observations")
  await field(page, "Short Text", "Register reference")
  await field(page, "Repeating Editable Table", "Equipment items")
  await page.getByLabel("Required question", { exact: true }).check()
  await page.getByLabel("Minimum rows", { exact: true }).fill("1")
  await page.getByLabel("Maximum rows", { exact: true }).fill("3")
  await page.getByRole("button", { name: "Add column", exact: true }).click()
  await page
    .getByLabel("Column 1 label", { exact: true })
    .fill("Equipment Name")
  await page.getByLabel("Required column 1", { exact: true }).check()
  await page.getByRole("button", { name: "Add column", exact: true }).click()
  await page.getByLabel("Column 2 label", { exact: true }).fill("Serial Number")
  const preview = page.locator(".ad-preview-frame")
  await preview.getByRole("button", { name: "Add Row", exact: true }).click()
  await preview
    .getByLabel("Equipment Name · Row 1", { exact: true })
    .fill("Preview chair")
  await preview
    .getByRole("button", { name: "Remove draft row 1", exact: true })
    .click()
  await page.getByRole("button", { name: "Save Draft", exact: true }).click()
  await publish(page)
  await assign(page)
  await staffClient(page, "chart")
  await page
    .locator(".cm-category")
    .filter({ hasText: "Fictional configured Equipment Register" })
    .getByRole("link", { name: /Add entry/ })
    .click()
  await page
    .getByLabel("Register reference", { exact: true })
    .fill("Fictional-001")
  await page.getByRole("button", { name: "Add Row", exact: true }).click()
  await page
    .getByLabel("Equipment Name · Row 1", { exact: true })
    .fill("Fictional chair")
  await page
    .getByLabel("Serial Number · Row 1", { exact: true })
    .fill("DEMO-123")
  await page
    .getByLabel("Reason for off-shift documentation", { exact: true })
    .fill("Example")
  await captureStaff(page, info.project.name, "staff-chart")
  await page.getByRole("button", { name: "Submit entry", exact: true }).click()
  await expect(page.getByText(/Template v1 · Taylor Reed/)).toBeVisible()
  await expect(
    page.getByRole("columnheader", { name: "Equipment Name", exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole("cell", { name: "Fictional chair", exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole("cell", { name: "DEMO-123", exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Add Row", exact: true }),
  ).toHaveCount(0)
  await captureStaff(page, info.project.name, "staff-chart-record")
  await bounds(page)
})
test("Client and House categories flow to Staff, deactivate and retain submitted names", async ({
  page,
}) => {
  test.skip(
    page.viewportSize()!.width < 1024,
    "Management remains desktop-only",
  )
  await enter(page)
  await tab(page, "Diary categories")
  for (const scope of ["Client", "House"]) {
    await page
      .getByRole("button", { name: "Add category", exact: true })
      .click()
    const d = page.getByRole("dialog", {
      name: "Add diary category",
      exact: true,
    })
    await d
      .getByLabel("Category name", { exact: true })
      .fill(`Fictional ${scope} Category`)
    await d
      .getByLabel("Applies to", { exact: true })
      .selectOption(scope.toLowerCase())
    await d.getByRole("button", { name: "Save category", exact: true }).click()
  }
  await staffClient(page, "diary")
  await page.getByRole("link", { name: "New entry", exact: true }).click()
  await expect(
    page.getByLabel("Category", { exact: true }).locator("option"),
  ).toContainText(["Fictional Client Category"])
  await expect(
    page
      .getByLabel("Category", { exact: true })
      .locator("option")
      .filter({ hasText: "Fictional House Category" }),
  ).toHaveCount(0)
  await page
    .getByLabel("Entry title", { exact: true })
    .fill("Fictional category integration")
  await page
    .getByLabel("Category", { exact: true })
    .selectOption({ label: "Fictional Client Category" })
  await page
    .getByLabel("Diary entry", { exact: true })
    .fill("Fictional category record for testing only")
  await page
    .getByLabel("Reason for off-shift documentation", { exact: true })
    .fill("Example")
  await page.getByRole("button", { name: "Submit entry", exact: true }).click()
  await expect(
    page
      .locator(".cm-history .cm-status")
      .getByText("Fictional Client Category", { exact: true }),
  ).toBeVisible()
  await backToAdmin(page)
  const row = page
    .getByRole("row")
    .filter({ hasText: "Fictional Client Category" })
  await row.getByRole("button", { name: "Edit", exact: true }).click()
  const edit = page.getByRole("dialog", {
    name: "Edit diary category",
    exact: true,
  })
  await edit
    .getByLabel("Category name", { exact: true })
    .fill("Renamed inactive category")
  await edit.getByLabel("Status", { exact: true }).selectOption("false")
  await edit.getByRole("button", { name: "Save category", exact: true }).click()
  await staffClient(page, "diary")
  await page.getByRole("link", { name: "New entry", exact: true }).click()
  await expect(
    page
      .getByLabel("Category", { exact: true })
      .locator("option")
      .filter({
        hasText: /Fictional Client Category|Renamed inactive category/,
      }),
  ).toHaveCount(0)
  await page.getByRole("button", { name: "Cancel", exact: true }).click()
  await page
    .getByLabel("Search diary entries", { exact: true })
    .fill("Fictional category integration")
  await page.locator(".cm-history-head").click()
  await expect(
    page
      .locator(".cm-history .cm-status")
      .getByText("Fictional Client Category", { exact: true }),
  ).toBeVisible()
  await page
    .locator(".cm-sidebar")
    .getByRole("button", { name: "Houses", exact: true })
    .click()
  await page
    .locator(".cm-house-card")
    .filter({ hasText: "Riverside Lodge" })
    .click()
  await page.getByRole("tab", { name: /diary/i }).click()
  await page.getByRole("link", { name: "New entry", exact: true }).click()
  await expect(
    page
      .getByLabel("Category", { exact: true })
      .locator("option")
      .filter({ hasText: "Fictional House Category" }),
  ).toHaveCount(1)
})
test("builder saves incomplete drafts, protects unsaved edits and rejects invalid options/conditions", async ({
  page,
}) => {
  test.skip(
    page.viewportSize()!.width < 1024,
    "Management remains desktop-only",
  )
  await enter(page)
  await create(page, "care", "Fictional validation draft")
  await expect(
    page.getByRole("button", { name: "Publish v1", exact: true }),
  ).toBeDisabled()
  await page.getByRole("button", { name: "Save Draft", exact: true }).click()
  await expect(
    page.getByText("Draft saved in this development session.", { exact: true }),
  ).toBeVisible()
  await section(page)
  await field(page, "Dropdown", "Choose one")
  await page.getByRole("button", { name: "Add option", exact: true }).click()
  await page
    .getByLabel("Option 2 stable value", { exact: true })
    .fill("option_1")
  await page.getByRole("button", { name: /^Validate/ }).click()
  await expect(page.locator(".cm-banner[role=alert]")).toContainText(
    "unique stable values",
  )
  await expect(
    page.getByRole("button", { name: "Publish v1", exact: true }),
  ).toBeDisabled()
  await page
    .getByLabel("Option 2 stable value", { exact: true })
    .fill("option_2")
  await page
    .getByRole("button", { name: "Duplicate Choose one", exact: true })
    .click()
  await page.getByLabel("Field label", { exact: true }).fill("Dependent")
  await page
    .getByLabel("Show only when a condition matches", { exact: true })
    .check()
  await page
    .getByLabel("Expected value", { exact: true })
    .selectOption("option_1")
  await page.getByRole("button", { name: "Save Draft", exact: true }).click()
  await page.getByLabel("Field label", { exact: true }).fill("Unsaved label")
  page.once("dialog", (d) => d.dismiss())
  await page.getByRole("tab", { name: /^Version history/ }).click()
  await expect(page.getByLabel("Field label", { exact: true })).toHaveValue(
    "Unsaved label",
  )
  await page.getByRole("button", { name: "Save Draft", exact: true }).click()
  await tab(page, "Preview")
  await expect(page.locator(".ad-preview-frame")).toBeVisible()
  await page
    .getByRole("button", { name: "Desktop preview", exact: true })
    .click()
  await expect(page.locator(".ad-preview--desktop")).toBeVisible()
  await bounds(page)
})
test("Manager access and Staff/Senior restrictions remain explicit", async ({
  page,
}) => {
  test.skip(
    page.viewportSize()!.width < 1024,
    "Management remains desktop-only",
  )
  await enter(page)
  for (const role of ["Manager", "Staff", "Senior Staff", "Administrator"]) {
    await page.locator(".ad-account").click()
    await page
      .getByLabel("Preview role · no trusted session", { exact: true })
      .selectOption(role)
    await page.keyboard.press("Escape")
    if (["Staff", "Senior Staff"].includes(role)) {
      await expect(
        page.getByText(
          "Staff and Senior Staff cannot use Admin management screens or mutations.",
          { exact: true },
        ),
      ).toBeVisible()
      await expect(
        page.getByRole("button", {
          name: "Create Care Plan Template",
          exact: true,
        }),
      ).toHaveCount(0)
    } else
      await expect(
        page.getByRole("button", {
          name: "Create Care Plan Template",
          exact: true,
        }),
      ).toBeVisible()
  }
})
