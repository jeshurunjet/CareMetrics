import { test, expect, type Page } from "@playwright/test"
import { mkdir } from "node:fs/promises"
import { hasUiReference } from "../reference-availability"
const history = "/clients/c1?tab=care&sub=t1"
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-22T01:00:00.000Z"))
  await page.route(/https:\/\/.*basemaps\.cartocdn\.com\/.*/, (r) =>
    r.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#eef0ed"/></svg>',
    }),
  )
  await page.route("https://images.unsplash.com/**", (r) =>
    r.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="320"><rect width="640" height="320" fill="#dde8e4"/></svg>',
    }),
  )
})
async function skinValues(page: Page) {
  await page
    .getByLabel("Date and time observed", { exact: true })
    .fill("2026-10-22T12:00")
  await page
    .getByRole("radiogroup", { name: "Overall skin condition", exact: true })
    .getByRole("radio", { name: "Intact", exact: true })
    .click()
  await page
    .getByRole("radiogroup", {
      name: "Redness or discolouration observed?",
      exact: true,
    })
    .getByRole("radio", { name: "No", exact: true })
    .click()
}
async function reason(page: Page) {
  await page
    .getByLabel("Reason for off-shift documentation", { exact: true })
    .fill("Completing a fictional review after handover")
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
}
test("only assigned care categories with correct client context and empty state", async ({
  page,
}) => {
  await page.goto("/clients/c1")
  await page.getByRole("tab", { name: /Care Plan/ }).click()
  await expect(page.locator(".cm-category")).toHaveCount(3)
  const skin = page
    .locator(".cm-category")
    .filter({ hasText: "Skin Integrity" })
  await expect(skin).toContainText("Template v2")
  await skin.getByRole("link", { name: /View records/ }).click()
  await expect(page).toHaveURL(/tab=care&sub=t1$/)
  await expect(
    page.getByRole("heading", { name: "Skin Integrity", exact: true }),
  ).toBeVisible()
  await page.getByRole("link", { name: "All assessments", exact: true }).click()
  await expect(page.locator(".cm-category")).toHaveCount(3)
  await page.goBack()
  await expect(page).toHaveURL(/sub=t1$/)
  await page.reload()
  await expect(page.locator(".cm-history")).toHaveCount(6)
  await page.goto("/clients/c2?tab=care")
  await expect(page.locator(".cm-category")).toHaveCount(1)
  await page.goto("/clients/c3?tab=care")
  await expect(
    page.getByText(
      "No care plan assessments are currently assigned to this client.",
      { exact: true },
    ),
  ).toBeVisible()
})
test("assessment history scopes, searches, filters, paginates and reads old version", async ({
  page,
}) => {
  await page.goto(history)
  await expect(page.locator(".cm-history")).toHaveCount(6)
  await expect(page.locator(".cm-history").first()).toContainText(
    "Fictional observation 1",
  )
  await page.getByRole("button", { name: "Next page", exact: true }).click()
  await expect(page.locator(".cm-history")).toHaveCount(2)
  await page.locator(".cm-history").first().locator(".cm-history-head").click()
  await page
    .locator(".cm-history")
    .first()
    .getByRole("link", { name: "View assessment", exact: true })
    .click()
  await expect(
    page.getByText("Original skin condition", { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText("Legacy fictional observation", { exact: true }),
  ).toBeVisible()
  await expect(page.getByText(/Template v1 · Taylor Reed/)).toBeVisible()
  await expect(
    page.getByText("Overall skin condition", { exact: true }),
  ).toHaveCount(0)
  await page
    .getByRole("link", { name: "Back to assessment history", exact: true })
    .click()
  await page.getByRole("searchbox").fill("Fictional observation 4")
  await expect(page.locator(".cm-history")).toHaveCount(1)
  await page.getByRole("button", { name: "Clear search" }).click()
  await page.getByLabel("Date range", { exact: true }).selectOption("1")
  await expect(page.locator(".cm-history")).toHaveCount(1)
  await page.getByRole("searchbox").fill("No matching assessment")
  await expect(page.getByText("No records yet", { exact: true })).toBeVisible()
})
test("configured skin form validates, clears hidden values and submits read-only", async ({
  page,
}) => {
  await page.goto("/clients/c1/records/new?templateId=t1")
  await expect(page.getByText(/Off-Shift Entry/)).toBeVisible()
  await expect(
    page
      .getByRole("radiogroup", {
        name: "Pressure-area observation",
        exact: true,
      })
      .getByRole("radio", { name: "1", exact: true }),
  ).toHaveAttribute("aria-checked", "true")
  await page
    .getByRole("button", { name: "Submit assessment", exact: true })
    .click()
  await expect(
    page.getByText("This field is required.", { exact: true }),
  ).toHaveCount(2)
  await skinValues(page)
  const redness = page.getByRole("radiogroup", {
    name: "Redness or discolouration observed?",
    exact: true,
  })
  await redness.getByRole("radio", { name: "Yes", exact: true }).click()
  await expect(page.getByLabel("Body area", { exact: true })).toBeVisible()
  await page.getByLabel("Body area", { exact: true }).selectOption("Arms")
  await page
    .getByRole("group", { name: "Affected areas", exact: true })
    .getByRole("button", { name: "Heels", exact: true })
    .click()
  await page
    .getByLabel("Unusual findings", { exact: true })
    .fill("This answer must clear when hidden")
  await redness.getByRole("radio", { name: "No", exact: true }).click()
  await expect(page.getByLabel("Body area", { exact: true })).toHaveCount(0)
  await redness.getByRole("radio", { name: "Yes", exact: true }).click()
  await expect(page.getByLabel("Body area", { exact: true })).toHaveValue("")
  await expect(
    page.getByLabel("Unusual findings", { exact: true }),
  ).toHaveValue("")
  await redness.getByRole("radio", { name: "No", exact: true }).click()
  await page
    .getByRole("button", { name: "Submit assessment", exact: true })
    .click()
  await expect(
    page.getByText("A reason is required when you are not clocked in.", {
      exact: true,
    }),
  ).toBeVisible()
  await reason(page)
  await page
    .getByLabel("Notes", { exact: true })
    .fill("Fictional long note. ".repeat(75))
  await page
    .getByRole("button", { name: "Submit assessment", exact: true })
    .click()
  await expect(
    page.getByText("Assessment submitted in development preview", {
      exact: true,
    }),
  ).toBeVisible()
  await expect(page.getByText(/Template v2 · Taylor Reed/)).toBeVisible()
  await expect(page.getByRole("textbox")).toHaveCount(0)
  await expect(page.getByRole("button", { name: /edit|delete/i })).toHaveCount(
    0,
  )
  await expect(
    page.getByText("This answer must clear when hidden", { exact: true }),
  ).toHaveCount(0)
  await noOverflow(page)
  await page.reload()
  await expect(
    page.getByText("Assessment unavailable", { exact: true }),
  ).toBeVisible()
})
test("medical form has number validation and conditional sections", async ({
  page,
}) => {
  await page.goto("/clients/c1/records/new?templateId=t2")
  await expect(
    page.getByText("Repeating table · unavailable in this phase", {
      exact: true,
    }),
  ).toBeVisible()
  await expect(
    page.getByRole("radiogroup", {
      name: "Overall skin condition",
      exact: true,
    }),
  ).toHaveCount(0)
  await page.getByLabel("Fluid intake (ml)", { exact: true }).fill("-1")
  await page.getByLabel("Urine output (ml)", { exact: true }).fill("200")
  await page
    .getByLabel("Equipment/device", { exact: true })
    .selectOption("Catheter")
  const catheter = page.getByRole("radiogroup", {
    name: "Catheter present?",
    exact: true,
  })
  await catheter.getByRole("radio", { name: "Yes", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "Catheter observations", exact: true }),
  ).toBeVisible()
  await reason(page)
  await page
    .getByRole("button", { name: "Submit assessment", exact: true })
    .click()
  await expect(
    page.getByText("Must be at least 0.", { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText("This field is required.", { exact: true }),
  ).toHaveCount(2)
  await catheter.getByRole("radio", { name: "No", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "Catheter observations", exact: true }),
  ).toHaveCount(0)
  await page.getByLabel("Fluid intake (ml)", { exact: true }).fill("250")
  await page
    .getByLabel("Observation follow-up time", { exact: true })
    .fill("2026-10-22T13:00")
  await page
    .getByRole("button", { name: "Submit assessment", exact: true })
    .click()
  await expect(
    page.getByText("Assessment submitted in development preview", {
      exact: true,
    }),
  ).toBeVisible()
  await expect(page.getByText("250", { exact: true })).toBeVisible()
  await expect(
    page.getByText("Device-related observations", { exact: true }),
  ).toHaveCount(0)
})
test("receipt form date/time/select/defaults and keyboard radio work", async ({
  page,
}) => {
  await page.goto("/clients/c1/records/new?templateId=t3")
  await expect(
    page.getByText(/No prescribing, administration or dosage calculation/),
  ).toBeVisible()
  await expect(
    page.getByLabel("Delivery reference", { exact: true }),
  ).toHaveValue("DEMO-")
  const received = page.getByRole("radiogroup", {
    name: "Medications received or collected?",
    exact: true,
  })
  await received.getByRole("radio", { name: "Yes", exact: true }).focus()
  await page.keyboard.press("ArrowRight")
  await expect(
    received.getByRole("radio", { name: "No", exact: true }),
  ).toHaveAttribute("aria-checked", "true")
  await received.getByRole("radio", { name: "Yes", exact: true }).click()
  await page
    .getByLabel("Received from", { exact: true })
    .selectOption("Pharmacy delivery")
  await page
    .getByRole("radiogroup", {
      name: "Receipt recorded in check-in log?",
      exact: true,
    })
    .getByRole("radio", { name: "Yes", exact: true })
    .click()
  await page.getByLabel("Receipt date", { exact: true }).fill("2026-10-21")
  await page.getByLabel("Receipt time", { exact: true }).fill("13:30")
  await reason(page)
  await page
    .getByRole("button", { name: "Submit assessment", exact: true })
    .click()
  await expect(
    page.getByText("Assessment submitted in development preview", {
      exact: true,
    }),
  ).toBeVisible()
  await expect(
    page.getByText("Pharmacy delivery", { exact: true }),
  ).toBeVisible()
})
test("partial draft save, resume, edit and submit retain version", async ({
  page,
}) => {
  await page.goto("/clients/c1/records/new?templateId=t1")
  await page.getByRole("button", { name: "Save draft", exact: true }).click()
  await expect(page.getByText(/Template v2 · Taylor Reed/)).toBeVisible()
  await page.getByRole("link", { name: "Continue draft", exact: true }).click()
  await expect(
    page.getByRole("heading", {
      name: "Continue draft — Skin Integrity",
      exact: true,
    }),
  ).toBeVisible()
  await skinValues(page)
  await page
    .getByLabel("Notes", { exact: true })
    .fill("Draft survives client-side navigation")
  await page.getByRole("button", { name: "Save draft", exact: true }).click()
  await expect(
    page.getByText("Draft survives client-side navigation", { exact: true }),
  ).toBeVisible()
  await page.getByRole("link", { name: "Continue draft", exact: true }).click()
  await expect(page.getByLabel("Notes", { exact: true })).toHaveValue(
    "Draft survives client-side navigation",
  )
  await reason(page)
  await page
    .getByRole("button", { name: "Submit assessment", exact: true })
    .click()
  await expect(
    page.getByText("Assessment submitted in development preview", {
      exact: true,
    }),
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: "Continue draft", exact: true }),
  ).toHaveCount(0)
})
test("assessment correction preserves original values and pending status", async ({
  page,
}) => {
  await page.goto(`${history}&item=care-c1-skin-1`)
  await page
    .getByRole("link", { name: "Request correction", exact: true })
    .click()
  await expect(
    page.getByText("Original submitted entry · Skin Integrity", {
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
    .fill("Fictional wording review")
  await page
    .getByLabel("Proposed correction", { exact: true })
    .fill("Notes → Proposed fictional replacement")
  await page
    .getByRole("button", { name: "Submit request", exact: true })
    .click()
  await expect(
    page.getByRole("heading", {
      name: "Correction pending review",
      exact: true,
    }),
  ).toBeVisible()
  await expect(
    page.getByText(
      "Fictional observation 1. Interface demonstration only; no real health information.",
      { exact: true },
    ),
  ).toBeVisible()
  await expect(
    page.getByText("Notes → Proposed fictional replacement", { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: "Request correction", exact: true }),
  ).toHaveCount(0)
  await expect(
    page.getByRole("button", { name: /approve|reject/i }),
  ).toHaveCount(0)
  await page.goto("/clients/c1?tab=care&sub=t2&item=care-c1-medical-1")
  await expect(
    page.getByRole("heading", {
      name: "Correction pending review",
      exact: true,
    }),
  ).toBeVisible()
})
test("demo-active state permits assessment without off-shift reason", async ({
  page,
}) => {
  await page.goto("/shift-check")
  await page
    .getByRole("button", { name: "Demo active attendance", exact: true })
    .click()
  await page
    .getByRole("button", { name: "Continue to dashboard", exact: true })
    .click()
  await page
    .locator(".cm-client-card")
    .filter({ hasText: "Taylor Reed" })
    .click()
  await page.getByRole("tab", { name: /Care Plan/ }).click()
  await page
    .locator(".cm-category")
    .filter({ hasText: "Skin Integrity" })
    .getByRole("link", { name: /Add entry/ })
    .click()
  await expect(page.getByText(/Demo active attendance · UI only/)).toBeVisible()
  await expect(
    page.getByLabel("Reason for off-shift documentation", { exact: true }),
  ).toHaveCount(0)
  await skinValues(page)
  await page
    .getByRole("button", { name: "Submit assessment", exact: true })
    .click()
  await expect(
    page.getByText("Assessment submitted in development preview", {
      exact: true,
    }),
  ).toBeVisible()
})
test("rejects unknown/unassigned template routes and private/mismatched records", async ({
  page,
  request,
}) => {
  for (const path of [
    "/clients/c4/records/new?templateId=t-private",
    "/clients/c2/records/new?templateId=t2",
    "/clients/c1/records/new?templateId=missing",
    "/clients/c1/records/new",
    "/clients/c1?tab=care&sub=t-private",
    "/clients/c1?tab=care&sub=missing",
  ]) {
    const res = await request.get(path)
    expect(res.status()).toBe(404)
    expect(await res.text()).not.toContain("Unassigned assessment content")
  }
  for (const path of [
    `${history}&item=care-c2-skin-1`,
    `${history}&item=missing`,
    `${history}&item=care-private-1`,
    "/clients/c1/records/new?templateId=t1&draft=care-c1-skin-9",
    "/clients/c1/records/new?templateId=t1&draft=care-c1-skin-1",
    `${history}&item=care-c1-medical-1`,
  ]) {
    await page.goto(path)
    await expect(
      page.getByText("Assessment unavailable", { exact: true }),
    ).toBeVisible()
    await expect(
      page.getByText("Separate fictional client observation.", { exact: true }),
    ).toHaveCount(0)
  }
  await page.goto(`${history}&item=care-c1-skin-7`)
  await page.reload()
  await expect(
    page.getByText("Original skin condition", { exact: true }),
  ).toBeVisible()
})
test("unsaved assessment prompts on cancel and contextual navigation", async ({
  page,
}) => {
  await page.goto(history)
  await page.getByRole("link", { name: "New assessment", exact: true }).click()
  await page.getByLabel("Notes", { exact: true }).fill("Unsaved assessment")
  await page.getByRole("button", { name: "Cancel", exact: true }).click()
  await page.getByRole("button", { name: "Keep editing", exact: true }).click()
  page.once("dialog", (d) => d.dismiss())
  await page
    .locator(".cm-crumb-list")
    .getByRole("button", { name: "Care Plan", exact: true })
    .click()
  await expect(page.getByLabel("Notes", { exact: true })).toHaveValue(
    "Unsaved assessment",
  )
  await page.getByRole("button", { name: "Cancel", exact: true }).click()
  await page.getByRole("button", { name: "Discard", exact: true }).click()
  await expect(page).toHaveURL(/tab=care&sub=t1$/)
})
test("capture Care Plan source comparisons and responsive fields", async ({
  page,
}, info) => {
  test.setTimeout(60000)
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  await mkdir("test-results/phase-1c2", { recursive: true })
  const capture = async (name: string, focus?: string) => {
    await page.evaluate(() => document.fonts.ready)
    if (focus)
      await page
        .locator(focus)
        .first()
        .evaluate((el) => el.scrollIntoView({ block: "start" }))
    // Focused capture scrolls only the intended content pane; reset outer document
    // scroll that browser scrollIntoView can introduce for overflow-hidden ancestors.
    await page.evaluate(() => {
      document.scrollingElement?.scrollTo(0, 0)
      document.querySelector(".cm-app")?.scrollTo(0, 0)
    })
    await noOverflow(page)
    await page.screenshot({
      animations: "disabled",
      style: "nextjs-portal {display:none!important}",
      path: `test-results/phase-1c2/${info.project.name}-${name}.png`,
    })
  }
  await page.goto("/clients/c1?tab=care")
  await expect(page.locator(".cm-category")).toHaveCount(3)
  await capture("migrated-categories")
  await page
    .locator(".cm-category-grid")
    .evaluate((el) => el.scrollIntoView({ block: "start" }))
  await capture("migrated-category-list")
  await page
    .locator(".cm-category")
    .filter({ hasText: "Skin Integrity" })
    .getByRole("link", { name: /View records/ })
    .click()
  await expect(page.locator(".cm-history")).toHaveCount(6)
  await page
    .locator(".cm-toolbar")
    .evaluate((el) => el.scrollIntoView({ block: "start" }))
  await capture("migrated-history")
  await page
    .locator(".cm-history")
    .first()
    .getByRole("link", { name: "View assessment", exact: true })
    .click()
  await expect(page.getByText(/Template v2 · Taylor Reed/)).toBeVisible()
  await capture("migrated-submitted", ".cm-panel")
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
  await page.goto("/clients/c1/records/new?templateId=t1")
  await expect(
    page.getByRole("heading", { name: "Skin Integrity", exact: true }),
  ).toBeVisible()
  await capture("migrated-new")
  await page
    .locator(".cm-form-section")
    .first()
    .evaluate((el) => el.scrollIntoView({ block: "start" }))
  await capture("migrated-fields")
  await page
    .getByRole("radiogroup", {
      name: "Redness or discolouration observed?",
      exact: true,
    })
    .getByRole("radio", { name: "Yes", exact: true })
    .click()
  await expect(page.getByLabel("Body area", { exact: true })).toBeVisible()
  await capture("migrated-conditional")
  for (const button of await page.locator(".cm-form-actions button").all()) {
    const box = await button.boundingBox()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width)
  }
  page.once("dialog", (d) => d.accept())
  await page.goto("/clients/c1/records/new?templateId=t1&draft=care-c1-skin-8")
  await expect(
    page.getByRole("heading", {
      name: "Continue draft — Skin Integrity",
      exact: true,
    }),
  ).toBeVisible()
  await page
    .locator(".cm-form-section")
    .first()
    .evaluate((el) => el.scrollIntoView({ block: "start" }))
  await capture("migrated-draft")
  await page.goto("/clients/c1/records/new?templateId=t2")
  await page
    .getByRole("radiogroup", { name: "Catheter present?", exact: true })
    .getByRole("radio", { name: "Yes", exact: true })
    .click()
  await page
    .locator(".cm-form-section")
    .first()
    .evaluate((el) => el.scrollIntoView({ block: "start" }))
  await capture("migrated-medical-fields")
  await page
    .getByRole("heading", { name: "Catheter observations", exact: true })
    .evaluate((el) => el.scrollIntoView({ block: "start" }))
  await capture("migrated-medical")
  page.once("dialog", (d) => d.accept())
  await page.goto("/clients/c1/records/new?templateId=t3")
  await page
    .locator(".cm-form-section")
    .first()
    .evaluate((el) => el.scrollIntoView({ block: "start" }))
  await capture("migrated-receipt")
  if (hasUiReference) {
    await page.goto("http://localhost:8557/")
    await page.waitForLoadState("networkidle")
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
    await page.getByRole("tab", { name: /Care Plan/ }).click()
    await expect(page.locator(".cm-category")).toHaveCount(3)
    await capture("original-categories")
    await page
      .locator(".cm-category-grid")
      .evaluate((el) => el.scrollIntoView({ block: "start" }))
    await capture("original-category-list")
    await page
      .locator(".cm-category")
      .filter({ hasText: "Skin Integrity" })
      .click()
    await expect(page.locator(".cm-history")).toHaveCount(6)
    await page
      .locator(".cm-search")
      .evaluate((el) => el.scrollIntoView({ block: "start" }))
    await capture("original-history")
    const originalSubmitted = page.locator(".cm-history").nth(1)
    await originalSubmitted.locator(".cm-history-head").click()
    await originalSubmitted
      .locator(".cm-history-body")
      .evaluate((el) => el.scrollIntoView({ block: "start" }))
    await expect(originalSubmitted).toContainText("Fictional observation 1.")
    await capture("original-submitted")
    await originalSubmitted
      .getByRole("button", { name: "Request correction", exact: true })
      .click()
    await capture("original-correction")
    await page.getByRole("button", { name: "Close", exact: true }).click()
    await page
      .getByRole("button", { name: "New assessment", exact: true })
      .click()
    await capture("original-new")
    await page
      .locator(".cm-form-section")
      .first()
      .evaluate((el) => el.scrollIntoView({ block: "start" }))
    await capture("original-fields")
    await page
      .getByRole("radiogroup", {
        name: "Redness or discolouration observed?",
        exact: true,
      })
      .getByRole("radio", { name: "Yes", exact: true })
      .click()
    await capture("original-conditional")
    await page.getByRole("button", { name: "Cancel", exact: true }).click()
    await page.getByRole("button", { name: "Discard", exact: true }).click()
    const originalDraft = page.locator(".cm-history").first()
    if (
      (await originalDraft
        .locator(".cm-history-head")
        .getAttribute("aria-expanded")) !== "true"
    )
      await originalDraft.locator(".cm-history-head").click()
    await page
      .getByRole("button", { name: "Continue draft", exact: true })
      .click()
    await page
      .locator(".cm-form-section")
      .first()
      .evaluate((el) => el.scrollIntoView({ block: "start" }))
    await capture("original-draft")
    await page.getByRole("button", { name: "Cancel", exact: true }).click()
    await page.getByRole("button", { name: "Discard", exact: true }).click()
    await page
      .getByRole("button", { name: "All assessments", exact: true })
      .click()
    await page
      .locator(".cm-category")
      .filter({ hasText: "Medical Cares Record" })
      .click()
    await page
      .getByRole("button", { name: "New assessment", exact: true })
      .click()
    await page
      .getByRole("radiogroup", { name: "Catheter present?", exact: true })
      .getByRole("radio", { name: "Yes", exact: true })
      .click()
    await page
      .locator(".cm-form-section")
      .first()
      .evaluate((el) => el.scrollIntoView({ block: "start" }))
    await capture("original-medical-fields")
    await page
      .getByRole("heading", { name: "Catheter observations", exact: true })
      .evaluate((el) => el.scrollIntoView({ block: "start" }))
    await capture("original-medical")
    await page.getByRole("button", { name: "Cancel", exact: true }).click()
    await page.getByRole("button", { name: "Discard", exact: true }).click()
    await page
      .getByRole("button", { name: "All assessments", exact: true })
      .click()
    await page
      .locator(".cm-category")
      .filter({ hasText: "Medication Receipt Record" })
      .click()
    await page
      .getByRole("button", { name: "New assessment", exact: true })
      .click()
    await page
      .locator(".cm-form-section")
      .first()
      .evaluate((el) => el.scrollIntoView({ block: "start" }))
    await capture("original-receipt")
  }
  expect(errors).toEqual([])
})
