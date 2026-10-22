import { test, expect, type Page } from "@playwright/test"
import { mkdir } from "node:fs/promises"
import { hasUiReference } from "../reference-availability"
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-22T01:00:00.000Z"))
  await page.route("https://images.unsplash.com/**", (r) =>
    r.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="320"><rect width="640" height="320" fill="#dde8e4"/></svg>',
    }),
  )
})
async function fillEntry(
  page: Page,
  title = "Fictional new note",
  house = false,
) {
  await page.getByLabel("Entry title", { exact: true }).fill(title)
  await page
    .getByLabel("Category", { exact: true })
    .selectOption(house ? "cat5" : "cat1")
  await page
    .getByLabel("Diary entry", { exact: true })
    .fill(
      "A new fictional note for development testing only.\nThe selected subject must remain correct.",
    )
  await page
    .getByLabel("Date and time covered", { exact: true })
    .fill("2026-10-22T12:00")
}
async function expectNoOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
}
test("client history scopes, sorts, filters and paginates", async ({
  page,
}) => {
  await page.goto("/clients/c1?tab=diary")
  await expect(page.locator(".cm-history")).toHaveCount(6)
  await expect(page.locator(".cm-history").first()).toContainText(
    "Daily activities 1",
  )
  await expect(page.locator(".cm-history-body")).toHaveCount(1)
  await expect(page.getByText("House handover", { exact: false })).toHaveCount(
    0,
  )
  await page.getByRole("button", { name: "Next page" }).click()
  await expect(page.locator(".cm-history")).toHaveCount(2)
  await expect(page.getByRole("link", { name: "Continue draft" })).toHaveCount(
    0,
  )
  await page.getByRole("button", { name: "Expand Daily activities 8" }).click()
  await page.getByRole("link", { name: "Continue draft" }).click()
  await expect(page).toHaveURL(/draft=client-c1-8/)
  await page.getByRole("button", { name: "Cancel", exact: true }).click()
  await expect(page).toHaveURL(/\/clients\/c1\?tab=diary$/)
  await expect(page.getByRole("searchbox")).toBeVisible()
  await page.getByLabel("Category", { exact: true }).selectOption("cat2")
  await expect(page.locator(".cm-history")).toHaveCount(1)
  await expect(page.locator(".cm-history")).toContainText("Daily activities 3")
  await page.getByLabel("Category", { exact: true }).selectOption("all")
  await page.getByLabel("Date range").selectOption("1")
  await expect(page.locator(".cm-history")).toHaveCount(1)
  await page.getByLabel("Date range").selectOption("all")
  await page.getByRole("searchbox").fill("Daily activities 5")
  await expect(page.locator(".cm-history")).toHaveCount(1)
  await page.getByRole("searchbox").fill("No matching diary")
  await expect(page.getByText("No diary entries found")).toBeVisible()
  await page.getByRole("button", { name: "Clear search" }).click()
  await expect(page.locator(".cm-history")).toHaveCount(6)
  await page.goto("/clients/c3?tab=diary")
  await expect(page.getByText("No diary entries found")).toBeVisible()
})
test("client submit validates, requires off-shift reason and becomes read-only", async ({
  page,
}) => {
  await page.goto("/clients/c1?tab=diary")
  await page.getByRole("link", { name: "New entry", exact: true }).click()
  await expect(page.getByText(/Off-Shift Entry/)).toBeVisible()
  await page.getByRole("button", { name: "Submit entry", exact: true }).click()
  await expect(page.getByText("Enter a title.", { exact: true })).toBeVisible()
  await expect(
    page.getByText("Choose a category.", { exact: true }),
  ).toBeVisible()
  await fillEntry(page)
  await page.getByRole("button", { name: "Submit entry", exact: true }).click()
  await expect(
    page.getByText("A reason is required when you are not clocked in.", {
      exact: true,
    }),
  ).toBeVisible()
  await page
    .getByLabel("Reason for off-shift documentation")
    .fill("Completing notes after handover")
  await page.getByRole("button", { name: "Submit entry", exact: true }).click()
  await expect(page).toHaveURL(/\/clients\/c1\?tab=diary$/)
  await expect(page.locator(".cm-history").first()).toContainText(
    "Fictional new note",
  )
  await page
    .locator(".cm-history")
    .first()
    .getByRole("link", { name: "View details" })
    .click()
  await expect(
    page.getByRole("heading", { name: "Fictional new note", exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText("Completing notes after handover", { exact: true }),
  ).toBeVisible()
  await expect(page.locator("textarea")).toHaveCount(0)
  await expect(page.getByRole("button", { name: /edit|delete/i })).toHaveCount(
    0,
  )
  await expect(page.locator(".cm-dl")).toContainText("12:00")
  await expect(page.locator(".cm-dl")).toContainText("14:00")
  await page.reload()
  await expect(
    page.getByText("Diary entry unavailable", { exact: true }),
  ).toBeVisible()
})
test("draft can be saved incomplete then continued and submitted", async ({
  page,
}) => {
  await page.goto("/clients/c1/diary/new")
  await page.getByRole("button", { name: "Save draft", exact: true }).click()
  await expect(page.getByText("Enter a title.", { exact: true })).toBeVisible()
  await page.getByLabel("Entry title", { exact: true }).fill("Session draft")
  await page.getByRole("button", { name: "Save draft", exact: true }).click()
  await expect(page.locator(".cm-history").first()).toContainText("Draft")
  await page
    .locator(".cm-history")
    .first()
    .getByRole("link", { name: "Continue draft" })
    .click()
  await expect(page.getByLabel("Entry title", { exact: true })).toHaveValue(
    "Session draft",
  )
  await fillEntry(page, "Completed draft")
  await page.getByRole("button", { name: "Save draft", exact: true }).click()
  await page
    .locator(".cm-history")
    .first()
    .getByRole("link", { name: "Continue draft" })
    .click()
  await expect(page.getByLabel("Entry title", { exact: true })).toHaveValue(
    "Completed draft",
  )
  await page
    .getByLabel("Reason for off-shift documentation")
    .fill("After handover")
  await page.getByRole("button", { name: "Submit entry", exact: true }).click()
  await expect(page.locator(".cm-history").first()).toContainText("Submitted")
  await expect(
    page
      .locator(".cm-history")
      .first()
      .getByRole("link", { name: "Continue draft" }),
  ).toHaveCount(0)
})
test("correction retains original and shows separate pending request", async ({
  page,
}) => {
  await page.goto("/clients/c1?tab=diary&item=client-c1-1")
  const original = await page.locator(".cm-diary-text").first().innerText()
  await page
    .getByRole("link", { name: "Request correction", exact: true })
    .click()
  await expect(
    page.getByText("Original submitted entry · Daily activities 1", {
      exact: true,
    }),
  ).toBeVisible()
  await page
    .getByRole("button", { name: "Submit request", exact: true })
    .click()
  await expect(
    page.getByText("Please explain why a correction is needed.", {
      exact: true,
    }),
  ).toBeVisible()
  await page
    .getByLabel("Reason for correction", { exact: true })
    .fill("Fictional wording correction")
  await page
    .getByLabel("Proposed correction", { exact: true })
    .fill("Proposed fictional replacement content.")
  await page
    .getByRole("button", { name: "Submit request", exact: true })
    .click()
  await expect(
    page.getByRole("heading", {
      name: "Correction pending review",
      exact: true,
    }),
  ).toBeVisible()
  await expect(page.locator(".cm-diary-text").first()).toHaveText(original)
  await expect(
    page.getByText("Proposed fictional replacement content.", { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: "Request correction", exact: true }),
  ).toHaveCount(0)
  await expect(page.getByRole("button", { name: /approve/i })).toHaveCount(0)
  await page
    .getByRole("link", { name: "Back to diary history", exact: true })
    .click()
  await expect(page.locator(".cm-history").first()).toContainText(
    "Pending review",
  )
})
test("house workflow stays separate including correction", async ({ page }) => {
  await page.goto("/houses/h1")
  await page.getByRole("tab", { name: "House diary", exact: true }).click()
  await expect(page.locator(".cm-history").first()).toContainText(
    "House handover 1",
  )
  await page.getByRole("link", { name: "New entry", exact: true }).click()
  await expect(page.locator(".cm-context")).toContainText("Riverside Lodge")
  await fillEntry(page, "Operational demo note", true)
  await page
    .getByLabel("Reason for off-shift documentation")
    .fill("House handover follow-up")
  await page.getByRole("button", { name: "Submit entry", exact: true }).click()
  await page
    .locator(".cm-history")
    .first()
    .getByRole("link", { name: "View details" })
    .click()
  await page
    .getByRole("link", { name: "Request correction", exact: true })
    .click()
  await page
    .getByLabel("Reason for correction", { exact: true })
    .fill("House wording update")
  await page
    .getByLabel("Proposed correction", { exact: true })
    .fill("Proposed operational text")
  await page
    .getByRole("button", { name: "Submit request", exact: true })
    .click()
  await expect(
    page.getByRole("heading", { name: "Correction pending review" }),
  ).toBeVisible()
  await page
    .getByRole("link", { name: "Back to diary history", exact: true })
    .click()
  await page
    .locator(".cm-crumb-list")
    .getByRole("button", { name: "Houses", exact: true })
    .click()
  await page.locator(".cm-house-card").first().click()
  await page
    .locator(".cm-client-card")
    .filter({ hasText: "Taylor Reed" })
    .click()
  await page.getByRole("tab", { name: "Diary", exact: true }).click()
  await expect(
    page.getByText("Operational demo note", { exact: true }),
  ).toHaveCount(0)
})
test("explicit demo active attendance removes off-shift requirement", async ({
  page,
}) => {
  await page.goto("/shift-check")
  await page.getByRole("button", { name: /Demo active attendance/ }).click()
  await page
    .getByRole("button", { name: "Continue to dashboard", exact: true })
    .click()
  await page
    .locator(".cm-client-card")
    .filter({ hasText: "Taylor Reed" })
    .click()
  await page.getByRole("tab", { name: "Diary", exact: true }).click()
  await page.getByRole("link", { name: "New entry", exact: true }).click()
  await expect(page.getByText(/Demo active attendance · UI only/)).toBeVisible()
  await expect(
    page.getByLabel("Reason for off-shift documentation"),
  ).toHaveCount(0)
  await fillEntry(page, "On-shift demo note")
  await page.getByRole("button", { name: "Submit entry", exact: true }).click()
  await expect(page.locator(".cm-history").first()).toContainText(
    "On-shift demo note",
  )
})
test("reject invalid, cross-subject, unassigned records and other-author drafts", async ({
  page,
  request,
}) => {
  for (const path of [
    "/clients/c4/diary/new",
    "/houses/h3/diary/new",
    "/clients/missing/diary/new",
    "/houses/missing/diary/new",
  ]) {
    const res = await request.get(path)
    expect(res.status()).toBe(404)
    expect(await res.text()).not.toMatch(/client-c4-1|house-h3-1/)
  }
  for (const path of [
    "/clients/c1?tab=diary&item=missing",
    "/clients/c1?tab=diary&item=house-h1-1",
    "/clients/c1?tab=diary&item=client-c4-1",
    "/clients/c1/diary/new?draft=client-c1-9",
    "/clients/c1/diary/new?draft=client-c1-1",
    "/houses/h1?tab=diary&item=client-c1-1",
  ]) {
    await page.goto(path)
    await expect(
      page.getByText("Diary entry unavailable", { exact: true }),
    ).toBeVisible()
    await expect(page.locator(".cm-diary-text")).toHaveCount(0)
  }
  await page.goto("/clients/c1?tab=diary&item=client-c1-1")
  await page.reload()
  await expect(
    page.getByRole("heading", { name: "Daily activities 1", exact: true }),
  ).toBeVisible()
})
test("unsaved form confirms cancel, navigation and browser back", async ({
  page,
}) => {
  await page.goto("/clients/c1?tab=diary")
  await page.getByRole("link", { name: "New entry", exact: true }).click()
  await page.getByLabel("Entry title", { exact: true }).fill("Unsaved")
  await page.getByRole("button", { name: "Cancel", exact: true }).click()
  await expect(
    page.getByRole("dialog", { name: "Discard changes?" }),
  ).toBeVisible()
  await page.getByRole("button", { name: "Keep editing", exact: true }).click()
  page.once("dialog", (d) => d.dismiss())
  await page
    .locator(".cm-crumb-list")
    .getByRole("button", { name: "Diary", exact: true })
    .click()
  await expect(page.getByLabel("Entry title", { exact: true })).toHaveValue(
    "Unsaved",
  )
  page.once("dialog", (d) => d.dismiss())
  await page.goBack()
  await expect(page.getByLabel("Entry title", { exact: true })).toHaveValue(
    "Unsaved",
  )
  await page.getByRole("button", { name: "Cancel", exact: true }).click()
  await page.getByRole("button", { name: "Discard", exact: true }).click()
  await expect(page).toHaveURL(/\?tab=diary$/)
})
test("capture diary source comparisons and responsive extensions", async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  await mkdir("test-results/phase-1c1", { recursive: true })
  const capture = async (name: string) => {
    await page.evaluate(() => document.fonts.ready)
    await expectNoOverflow(page)
    await page.screenshot({
      animations: "disabled",
      style: "nextjs-portal {display:none!important}",
      path: `test-results/phase-1c1/${info.project.name}-${name}.png`,
    })
  }
  await page.goto("/clients/c1?tab=diary")
  await expect(page.locator(".cm-history")).toHaveCount(6)
  await capture("migrated-client-history")
  await page
    .locator(".cm-toolbar")
    .evaluate((el) => el.scrollIntoView({ block: "start" }))
  await capture("migrated-client-history-list")
  await page
    .locator(".cm-history")
    .first()
    .getByRole("link", { name: "View details" })
    .click()
  await expect(
    page.getByRole("heading", { name: "Daily activities 1", exact: true }),
  ).toBeVisible()
  await page
    .getByRole("heading", { name: "Daily activities 1", exact: true })
    .evaluate((el) => el.scrollIntoView({ block: "start" }))
  await capture("migrated-details")
  await page
    .getByRole("link", { name: "Request correction", exact: true })
    .click()
  await expect(
    page.getByRole("heading", { name: "Request correction", exact: true }),
  ).toBeVisible()
  await page
    .getByRole("heading", { name: "Request correction", exact: true })
    .evaluate((el) => el.scrollIntoView({ block: "start" }))
  await capture("migrated-correction")
  await page.goto("/clients/c1/diary/new")
  for (const button of await page.locator(".cm-form-actions button").all()) {
    const box = await button.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width)
  }
  await capture("migrated-client-create")
  await page
    .locator(".cm-form")
    .evaluate((el) => el.scrollIntoView({ block: "start" }))
  await capture("migrated-client-create-fields")
  await page.goto("/houses/h1?tab=diary")
  await expect(page.locator(".cm-history")).toHaveCount(6)
  await capture("migrated-house-history")
  await page
    .locator(".cm-toolbar")
    .evaluate((el) => el.scrollIntoView({ block: "start" }))
  await capture("migrated-house-history-list")
  await page.getByRole("link", { name: "New entry", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "New diary entry", exact: true }),
  ).toBeVisible()
  await capture("migrated-house-create")
  await page
    .locator(".cm-form")
    .evaluate((el) => el.scrollIntoView({ block: "start" }))
  await capture("migrated-house-create-fields")
  if (hasUiReference) {
    await page.goto("http://localhost:8557/")
    await page
      .locator(".cm-sidebar-nav,.cm-bottom-nav")
      .getByRole("button", { name: "Houses", exact: true })
      .filter({ visible: true })
      .click()
    await page.locator(".cm-house-card").first().click()
    await page
      .locator(".cm-client-card")
      .filter({ hasText: "Taylor Reed" })
      .click()
    await page.getByRole("tab", { name: "Diary", exact: true }).click()
    await expect(page.locator(".cm-history")).toHaveCount(6)
    await capture("original-client-history")
    await page
      .locator(".cm-toolbar")
      .evaluate((el) => el.scrollIntoView({ block: "start" }))
    await capture("original-client-history-list")
    await page
      .locator(".cm-history-body")
      .first()
      .evaluate((el) => el.scrollIntoView({ block: "start" }))
    await capture("original-details")
    await page
      .locator(".cm-history")
      .first()
      .getByRole("button", { name: "Request correction", exact: true })
      .click()
    await capture("original-correction")
    await page.getByRole("button", { name: "Close", exact: true }).click()
    await page.getByRole("button", { name: "New entry", exact: true }).click()
    await capture("original-client-create")
    await page
      .locator(".cm-form")
      .evaluate((el) => el.scrollIntoView({ block: "start" }))
    await capture("original-client-create-fields")
    await page.getByRole("button", { name: "Cancel", exact: true }).click()
    await page.getByRole("button", { name: "Discard", exact: true }).click()
    await page
      .locator(".cm-sidebar-nav,.cm-bottom-nav")
      .getByRole("button", { name: "Houses", exact: true })
      .filter({ visible: true })
      .click()
    await page.locator(".cm-house-card").first().click()
    await page.getByRole("tab", { name: "House diary", exact: true }).click()
    await capture("original-house-history")
    await page
      .locator(".cm-toolbar")
      .evaluate((el) => el.scrollIntoView({ block: "start" }))
    await capture("original-house-history-list")
    await page.getByRole("button", { name: "New entry", exact: true }).click()
    await capture("original-house-create")
    await page
      .locator(".cm-form")
      .evaluate((el) => el.scrollIntoView({ block: "start" }))
    await capture("original-house-create-fields")
  }
  expect(errors).toEqual([])
})
