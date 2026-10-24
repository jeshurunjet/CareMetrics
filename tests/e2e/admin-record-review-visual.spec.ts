import { test, expect } from "@playwright/test"
import { mkdir } from "node:fs/promises"
import { hasUiReference } from "../reference-availability"
import { setup, tab, bounds } from "./documentation-helpers"
import { staffRecord, request, review, decide } from "./record-review-helpers"
test.use({ timezoneId: "Pacific/Auckland" })
test("capture submitted records and correction review against original Figma", async ({
  page,
}, info) => {
  test.setTimeout(180000)
  page.setDefaultTimeout(15000)
  await setup(page)
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  await mkdir("test-results/phase-1e4a", { recursive: true })
  const capture = async (side: string, state: string, focused = false) => {
    await page.evaluate(async () => {
      await document.fonts.ready
      document.querySelector(".ad-content")?.scrollTo(0, 0)
    })
    if (focused)
      await page
        .getByRole("heading", {
          name:
            side === "migrated"
              ? "Correction and revision history"
              : "Audit timeline",
          exact: true,
        })
        .evaluate((el) => {
          const container = document.querySelector(".ad-content")
          if (container)
            container.scrollTop +=
              el.getBoundingClientRect().top -
              container.getBoundingClientRect().top -
              16
        })
    if (side === "migrated") await bounds(page)
    await page.screenshot({
      path: `test-results/phase-1e4a/${info.project.name}-${side}-${state}.png`,
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
      await page.goto(
        "http://localhost:8557?screen=admin&scenario=record-review",
      )
      await capture("original", "desktop-notice")
    }
    expect(errors).toEqual([])
    return
  }
  await page
    .locator(".ad-nav")
    .getByRole("link", { name: /^Care Documentation/ })
    .click()
  await tab(page, "Submitted records")
  await expect(page.locator("tbody tr").first()).toBeVisible()
  await capture("migrated", "records-overview")
  for (const [type, state] of [
    ["Client Diary", "client-diary"],
    ["House Diary", "house-diary"],
  ]) {
    await page.getByLabel("Record type", { exact: true }).selectOption(type)
    await capture("migrated", state)
  }
  for (const [type, query, state] of [
    ["Care Plan", "care-c1-skin-7", "care-details"],
    ["Charting", "chart-exercise-1", "chart-details"],
    ["Charting", "chart-equipment-1", "table-record"],
  ]) {
    await page.getByLabel("Record type", { exact: true }).selectOption(type)
    await page
      .getByLabel("Search submitted records", { exact: true })
      .fill(query)
    await page
      .getByRole("link", { name: new RegExp(`View details ${query}`) })
      .click()
    await expect(page.getByRole("heading", { level: 1 })).not.toHaveText(
      "Care Documentation",
    )
    await expect(
      page.getByRole("heading", { name: "Context", exact: true }),
    ).toBeVisible()
    await capture("migrated", state)
    await page
      .getByRole("button", { name: "Submitted records", exact: true })
      .click()
  }
  await tab(page, "Correction requests")
  await capture("migrated", "pending-queue")
  await staffRecord(page, "diary", "client-c1-1")
  await request(
    page,
    "Review Client Diary wording",
    "Approved fictional replacement diary body.",
  )
  await review(page, "Review Client Diary wording")
  await capture("migrated", "text-comparison")
  await page.getByRole("button", { name: "Approve", exact: true }).click()
  await capture("migrated", "approve-confirmation")
  await page
    .getByRole("button", { name: "Keep reviewing", exact: true })
    .click()
  await decide(page, "Approve", "Confirmed against original narrative")
  await page.getByRole("link", { name: "Open record", exact: true }).click()
  await page
    .getByRole("heading", {
      name: "Correction and revision history",
      exact: true,
    })
    .scrollIntoViewIfNeeded()
  await capture("migrated", "approved-history")
  await capture("migrated", "history-detail", true)
  await staffRecord(page, "care", "care-c1-skin-7")
  await request(
    page,
    "Review v1 assessment answer",
    "Replace the original v1 text answer.",
    "Original skin condition",
    "Revised fictional v1 observation",
  )
  await review(page, "Review v1 assessment answer")
  await capture("migrated", "field-comparison")
  await staffRecord(page, "chart", "chart-equipment-1", "t6")
  await request(
    page,
    "Review equipment serial cell",
    "Serial number is REVISED-103.",
    "Equipment items · Row 1 · Serial number",
    "REVISED-103",
  )
  await review(page, "Review equipment serial cell")
  await capture("migrated", "cell-comparison")
  await page
    .getByLabel("Review notes", { exact: true })
    .fill("Original operational note is accurate")
  await page.getByRole("button", { name: "Reject", exact: true }).click()
  await capture("migrated", "reject-confirmation")
  await page
    .getByRole("button", { name: "Keep reviewing", exact: true })
    .click()
  // Cancel local notes before navigating to the source; the existing dirty guard remains active.
  await page.getByLabel("Review notes", { exact: true }).fill("")
  if (hasUiReference) {
    const original = "http://localhost:8557?screen=admin&scenario=record-review"
    const docs = async (scenario = false) => {
      await page.goto(
        scenario ? original : "http://localhost:8557?screen=admin",
      )
      await page
        .locator(".ad-nav")
        .getByRole("button", { name: /^Care Documentation/ })
        .click()
    }
    await docs()
    await tab(page, "Submitted records")
    await capture("original", "records-overview")
    await tab(page, "Client diary")
    await capture("original", "client-diary")
    await tab(page, "House diary")
    await capture("original", "house-diary")
    for (const [template, state] of [
      ["t1", "care-details"],
      ["t5", "chart-details"],
      ["t6", "table-record"],
    ]) {
      await docs()
      await tab(page, "Submitted records")
      await page
        .getByRole("combobox", { name: "Template", exact: true })
        .selectOption(template)
      if (template === "t1")
        await page
          .getByRole("columnheader", { name: "Covered", exact: true })
          .getByRole("button")
          .click()
      await page.locator("tbody tr").first().click()
      await expect(page.getByRole("heading", { level: 1 })).not.toHaveText(
        "Care Documentation",
      )
      await capture("original", state)
    }
    const sourceRequest = async (reason: string) => {
      await docs(true)
      await page.getByRole("tab", { name: /^Correction requests/ }).click()
      await page.getByRole("row").filter({ hasText: reason }).click()
      await expect(page.getByRole("heading", { level: 1 })).toContainText(
        "Correction request",
      )
    }
    await docs()
    await page.getByRole("tab", { name: /^Correction requests/ }).click()
    await capture("original", "pending-queue")
    await sourceRequest("Review Client Diary wording")
    await capture("original", "text-comparison")
    await page.getByRole("button", { name: "Approve", exact: true }).click()
    await capture("original", "approve-confirmation")
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Approve correction", exact: true })
      .click()
    await expect(page.locator(".ad-toast")).toHaveCount(0)
    await page.getByRole("button", { name: "Open record", exact: true }).click()
    await capture("original", "approved-history")
    await capture("original", "history-detail", true)
    await sourceRequest("Review v1 assessment answer")
    await capture("original", "field-comparison")
    await sourceRequest("Review equipment serial cell")
    await capture("original", "cell-comparison")
    await page
      .getByLabel("Review notes", { exact: true })
      .fill("Original operational note is accurate")
    await page.getByRole("button", { name: "Reject", exact: true }).click()
    await capture("original", "reject-confirmation")
  }
  expect(errors).toEqual([])
})
