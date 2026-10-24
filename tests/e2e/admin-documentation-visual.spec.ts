import { test, expect, type Locator } from "@playwright/test"
import { mkdir } from "node:fs/promises"
import { hasUiReference } from "../reference-availability"
import {
  setup,
  tab,
  create,
  section,
  field,
  bounds,
} from "./documentation-helpers"
test.use({ timezoneId: "Pacific/Auckland" })
test("capture documentation and shared builder against preserved Figma source", async ({
  page,
}, info) => {
  test.setTimeout(180000)
  page.setDefaultTimeout(15000)
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  await setup(page)
  await mkdir("test-results/phase-1e3", { recursive: true })
  const capture = async (side: string, state: string) => {
    await page.evaluate(async () => {
      await document.fonts.ready
      document.querySelector(".ad-content")?.scrollTo(0, 0)
    })
    if (side === "migrated") await bounds(page)
    await page.screenshot({
      path: `test-results/phase-1e3/${info.project.name}-${side}-${state}.png`,
      animations: "disabled",
    })
  }
  const focused = async (side: string, state: string, target: Locator) => {
    await target.scrollIntoViewIfNeeded()
    await page.evaluate(async () => {
      await document.fonts.ready
    })
    if (side === "migrated") await bounds(page)
    await page.screenshot({
      path: `test-results/phase-1e3/${info.project.name}-${side}-${state}.png`,
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
  await page
    .locator(".ad-nav")
    .getByRole("link", { name: /^Care Documentation/ })
    .click()
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Care Documentation",
  )
  await capture("migrated", "overview")
  await tab(page, "Diary categories")
  await expect(
    page.getByRole("columnheader", { name: "Category", exact: true }),
  ).toBeVisible()
  await capture("migrated", "categories")
  await tab(page, "Care Plan templates")
  await expect(
    page.getByRole("columnheader", { name: "Template", exact: true }),
  ).toBeVisible()
  await capture("migrated", "care-library")
  await tab(page, "Charting templates")
  await expect(
    page.getByRole("columnheader", { name: "Template", exact: true }),
  ).toBeVisible()
  await capture("migrated", "chart-library")
  await create(page, "care", "Fictional configuration preview")
  await capture("migrated", "empty-draft")
  await section(page)
  await field(page, "Dropdown", "Observation setting")
  await page
    .getByLabel("Default value", { exact: true })
    .selectOption("option_1")
  await capture("migrated", "field-properties")
  await page.getByRole("button", { name: "Add option", exact: true }).click()
  await page.getByLabel("Option 2 label", { exact: true }).fill("Option 2")
  await page
    .getByLabel("Option 2 stable value", { exact: true })
    .fill("option_2")
  await focused(
    "migrated",
    "options-detail",
    page.getByRole("button", { name: "Add option", exact: true }),
  )
  await field(page, "Long Text", "Additional observations")
  await capture("migrated", "populated-builder")
  await page
    .getByLabel("Show only when a condition matches", { exact: true })
    .check()
  await page
    .getByLabel("Expected value", { exact: true })
    .selectOption("option_1")
  await capture("migrated", "conditions")
  await focused(
    "migrated",
    "conditions-detail",
    page.getByLabel("Expected value", { exact: true }),
  )
  await page.getByRole("button", { name: "Save Draft", exact: true }).click()
  await tab(page, "Preview")
  await expect(page.locator(".ad-preview--mobile")).toBeVisible()
  await capture("migrated", "mobile-preview")
  await tab(page, "Form builder")
  await page
    .locator(".ad-palette .ad-outline-select")
    .filter({ hasText: "Observation setting" })
    .click()
  await page.getByLabel("Option 1 label", { exact: true }).fill("")
  await page.getByRole("button", { name: /^Validate/ }).click()
  await capture("migrated", "validation")
  await page.getByLabel("Option 1 label", { exact: true }).fill("Option 1")
  await page.getByRole("button", { name: "Save Draft", exact: true }).click()
  await page.getByRole("button", { name: "Publish v1", exact: true }).click()
  await expect(
    page.getByRole("dialog", {
      name: "Publish template version?",
      exact: true,
    }),
  ).toBeVisible()
  await capture("migrated", "publish")
  await page
    .getByRole("button", { name: "Confirm Publish", exact: true })
    .click()
  await tab(page, "Version history")
  await expect(
    page.getByRole("columnheader", { name: "Version", exact: true }),
  ).toBeVisible()
  await capture("migrated", "versions")
  await tab(page, "Assign to clients")
  await expect(
    page.getByRole("columnheader", { name: "Assigned version", exact: true }),
  ).toBeVisible()
  await capture("migrated", "assignments")
  await page
    .locator(".ad-nav")
    .getByRole("link", { name: /^Care Documentation/ })
    .click()
  await create(page, "chart", "Fictional table configuration")
  await section(page, "Equipment observations")
  await field(page, "Short Text", "Register reference")
  await field(page, "Repeating Editable Table", "Equipment items")
  await page.getByRole("button", { name: "Add column", exact: true }).click()
  await page
    .getByLabel("Column 1 label", { exact: true })
    .fill("Equipment Name")
  await page.getByRole("button", { name: "Add column", exact: true }).click()
  await page.getByLabel("Column 2 label", { exact: true }).fill("Serial Number")
  await capture("migrated", "table-columns")
  await focused(
    "migrated",
    "columns-detail",
    page.getByLabel("Column 2 label", { exact: true }),
  )
  await page.getByRole("button", { name: "Save Draft", exact: true }).click()
  if (hasUiReference) {
    await page.goto("http://localhost:8557?screen=admin")
    await page
      .locator(".ad-nav")
      .getByRole("button", { name: /^Care Documentation/ })
      .click()
    await capture("original", "overview")
    await tab(page, "Diary categories")
    await capture("original", "categories")
    await tab(page, "Care Plan templates")
    await capture("original", "care-library")
    await tab(page, "Charting templates")
    await capture("original", "chart-library")
    await tab(page, "Care Plan templates")
    await page
      .getByRole("button", { name: "Create template", exact: true })
      .click()
    await expect(page.locator(".ad-builder")).toBeVisible()
    await capture("original", "empty-draft")
    await page
      .locator(".ad-canvas-head .ad-title-input")
      .fill("Fictional configuration preview")
    await page
      .locator(".ad-palette")
      .getByRole("button", { name: "Dropdown", exact: true })
      .click()
    await page.locator("#p-l").fill("Observation setting")
    await capture("original", "field-properties")
    await focused(
      "original",
      "options-detail",
      page.getByRole("button", { name: "Add option", exact: true }),
    )
    await page
      .locator(".ad-palette")
      .getByRole("button", { name: "Long text", exact: true })
      .click()
    await page.locator("#p-l").fill("Additional observations")
    await capture("original", "populated-builder")
    await page.getByLabel("Only show this field when…", { exact: true }).check()
    await page.getByLabel("Value", { exact: true }).selectOption("Option 1")
    await capture("original", "conditions")
    await focused(
      "original",
      "conditions-detail",
      page.getByLabel("Value", { exact: true }),
    )
    await tab(page, "Preview")
    await page
      .locator(".ad-preview-frame")
      .getByLabel("Observation setting", { exact: true })
      .selectOption("Option 1")
    await capture("original", "mobile-preview")
    await tab(page, "Form builder")
    await page
      .locator(".ad-canvas")
      .getByText("Additional observations", { exact: true })
      .click()
    await page.locator("#p-l").fill("")
    await page
      .locator(".ad-builder-bar")
      .getByRole("button", { name: /issue/ })
      .click()
    await capture("original", "validation")
    await page.locator("#p-l").fill("Additional observations")
    await page.getByRole("button", { name: "Publish v1", exact: true }).click()
    await capture("original", "publish")
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /Publish/ })
      .click()
    await tab(page, "Version history")
    await expect(page.locator(".ad-toast")).toHaveCount(0)
    await capture("original", "versions")
    await page.getByRole("tab", { name: /^Assignments/ }).click()
    await page
      .getByRole("button", { name: "Assign to clients", exact: true })
      .click()
    await capture("original", "assignments")
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Cancel", exact: true })
      .click()
    await page
      .locator(".ad-nav")
      .getByRole("button", { name: /^Care Documentation/ })
      .click()
    await tab(page, "Charting templates")
    await page
      .getByRole("button", { name: "Create template", exact: true })
      .click()
    await page
      .locator(".ad-canvas-head .ad-title-input")
      .fill("Fictional table configuration")
    await page
      .locator(".ad-palette")
      .getByRole("button", { name: "Repeatable table", exact: true })
      .click()
    await page.locator("#p-l").fill("Equipment items")
    await page
      .getByLabel("Column label", { exact: true })
      .fill("Equipment Name")
    await page.getByRole("button", { name: "Add column", exact: true }).click()
    await page
      .getByLabel("Column label", { exact: true })
      .nth(1)
      .fill("Serial Number")
    await capture("original", "table-columns")
    await focused(
      "original",
      "columns-detail",
      page.getByLabel("Column label", { exact: true }).nth(1),
    )
    await page.goto("http://localhost:8557")
    await page
      .locator(".cm-sidebar")
      .getByRole("button", { name: "Home", exact: true })
      .click()
    await page
      .locator(".cm-client-card")
      .filter({ hasText: "Taylor Reed" })
      .click()
    await page.getByRole("tab", { name: /Care Plan/ }).click()
    await page
      .locator(".cm-category")
      .filter({ hasText: "Skin Integrity" })
      .click()
    await page
      .getByRole("button", { name: "New assessment", exact: true })
      .click()
    await capture("original", "staff-care")
    await page.goto("http://localhost:8557")
    await page
      .locator(".cm-sidebar")
      .getByRole("button", { name: "Home", exact: true })
      .click()
    await page
      .locator(".cm-client-card")
      .filter({ hasText: "Taylor Reed" })
      .click()
    await page.getByRole("tab", { name: /Charting/ }).click()
    await page
      .locator(".cm-category")
      .filter({ hasText: "Equipment Register" })
      .click()
    await page.getByRole("button", { name: "Add entry", exact: true }).click()
    await capture("original", "staff-chart")
  }
  expect(errors).toEqual([])
})
