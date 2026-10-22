import { test, expect } from "@playwright/test"
import type { Page } from "@playwright/test"
import { hasUiReference } from "../reference-availability"
import { mkdir } from "node:fs/promises"
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-22T01:00:00.000Z"))
  await page.route("https://images.unsplash.com/**", (r) =>
    r.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="320"><rect width="640" height="320" fill="#dde8e4"/><path d="M210 200V130l110-75 110 75v70" fill="#a6bbb1"/></svg>',
    }),
  )
  await page.route(/https:\/\/.*basemaps\.cartocdn\.com\/.*/, (r) =>
    r.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#eef0ed"/></svg>',
    }),
  )
})
async function client(page: Page, id = "c1") {
  await page.goto(`/clients/${id}`)
  await expect(page.locator(".cm-profile-head h1")).toBeVisible()
}
test("all assigned houses, current-shift highlight, switch and own clients", async ({
  page,
}) => {
  await page.goto("/houses")
  await expect(page.locator(".cm-house-card")).toHaveCount(2)
  await expect(page.getByText("Your shift today", { exact: true })).toHaveCount(
    1,
  )
  await expect(page.getByText("Cedar Hill")).toHaveCount(0)
  await page.locator(".cm-house-card").first().click()
  await expect(page).toHaveURL(/\/houses\/h1$/)
  await expect(page.locator(".cm-client-card")).toHaveCount(2)
  await expect(page.getByText("Taylor Reed", { exact: true })).toBeVisible()
  await expect(page.getByText("Jordan Quinn", { exact: true })).toHaveCount(0)
  await page.getByLabel("Switch house").selectOption("h2")
  await expect(page).toHaveURL(/\/houses\/h2\?tab=overview$/)
  await expect(page.locator(".cm-client-card")).toHaveCount(1)
  await expect(page.getByText("Jordan Quinn", { exact: true })).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole("heading", { name: "Sunrise House", exact: true }),
  ).toBeVisible()
  await page.goBack()
  await expect(page).toHaveURL(/\/houses\/h1$/)
})
test("dashboard → house → client → related house and correct read-only NOK", async ({
  page,
}) => {
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  await page.goto("/dashboard")
  await page.locator(".cm-house-mini").first().click()
  await page
    .locator(".cm-client-card")
    .filter({ hasText: "Taylor Reed" })
    .click()
  await expect(page).toHaveURL(/\/clients\/c1$/)
  await expect(page.locator(".cm-profile-head h1")).toHaveText("Taylor Reed")
  const contacts = page.getByTestId("contact-card")
  await expect(contacts).toHaveCount(2)
  await expect(contacts.first()).toContainText("Morgan Reed")
  await expect(contacts.first()).toContainText("Primary contact")
  await expect(contacts.first()).toContainText("Emergency contact")
  await expect(
    page.getByRole("link", {
      name: "Call Morgan Reed: 000 000 0101",
      exact: true,
    }),
  ).toHaveAttribute("href", "tel:0000000101")
  await expect(
    page.getByRole("link", {
      name: "Email Morgan Reed: morgan.reed@example.invalid",
    }),
  ).toHaveAttribute("href", "mailto:morgan.reed@example.invalid")
  await expect(
    page.getByRole("button", { name: "Edit profile" }),
  ).toBeDisabled()
  await page.getByRole("link", { name: "View contacts & next of kin" }).click()
  await expect(
    page.getByRole("heading", { name: "Contacts & next of kin" }),
  ).toBeInViewport()
  await page
    .getByRole("navigation", { name: "Breadcrumb" })
    .getByRole("button", { name: "Riverside Lodge" })
    .click()
  await expect(page).toHaveURL(/\/houses\/h1$/)
  expect(errors).toEqual([])
})
test("client context and missing contacts stay distinct on refresh", async ({
  page,
}) => {
  await client(page, "c3")
  await expect(page.locator(".cm-profile-head")).toContainText("Sunrise House")
  await expect(page.getByTestId("contact-card")).toHaveCount(1)
  await expect(page.getByTestId("contact-card")).toContainText("Riley Quinn")
  await expect(page.getByText("Telephone not recorded")).toBeVisible()
  await expect(page.getByTestId("contact-card")).not.toContainText(
    "Morgan Reed",
  )
  await page.reload()
  await expect(page.getByRole("heading", { name: "About Jordy" })).toBeVisible()
  await expect(page.getByText("Not recorded", { exact: true })).toBeVisible()
  await client(page, "c2")
  await expect(page.getByTestId("contact-card")).toHaveCount(0)
  await expect(page.getByText("No contacts recorded.")).toBeVisible()
})
test("search is scoped, returns house clients, clears, and preserves query/back", async ({
  page,
}) => {
  await page.goto("/search")
  const input = page.getByRole("searchbox", {
    name: "Search clients and houses",
  })
  await expect(
    page.getByRole("heading", { name: "Quick access" }),
  ).toBeVisible()
  await input.fill("Riverside")
  await expect(page.locator(".cm-result")).toHaveCount(3)
  await expect(
    page
      .locator(".cm-result")
      .filter({ hasText: /Morgan Reed|000 000 0101|NHI/ }),
  ).toHaveCount(0)
  await page.locator(".cm-result").filter({ hasText: "Taylor Reed" }).click()
  await expect(page).toHaveURL(/\/clients\/c1$/)
  await page.goBack()
  await expect(input).toHaveValue("Riverside")
  await page.reload()
  await expect(input).toHaveValue("Riverside")
  await page.getByRole("button", { name: "Clear search" }).click()
  await expect(input).toHaveValue("")
  await expect(
    page.getByRole("heading", { name: "Quick access" }),
  ).toBeVisible()
  for (const q of ["Cedar", "Unassigned Example", "Morgan Reed", "no-match"]) {
    await input.fill(q)
    await expect(
      page.getByText(`No results for "${q}"`, { exact: true }),
    ).toBeVisible()
    await expect(page.locator(".cm-result")).toHaveCount(0)
  }
  await input.fill("Jordy")
  await expect(page.locator(".cm-result")).toHaveCount(1)
  await page.locator(".cm-result").click()
  await expect(page).toHaveURL(/\/clients\/c3$/)
  await page.goto("/search?q=Sunrise")
  await expect(page.locator(".cm-result")).toHaveCount(2)
  await page.locator(".cm-result").filter({ hasText: "Open house" }).click()
  await expect(page).toHaveURL(/\/houses\/h2$/)
})
test("record tabs navigate to bounded placeholders with back and keyboard support", async ({
  page,
}) => {
  await client(page)
  await page.getByRole("tab", { name: /Care Plan/ }).click()
  await expect(page.locator(".cm-category")).toHaveCount(3)
  for (const [label, tab, title] of [
    ["Charting", "charting", "Client charting"],
    ["Gallery", "files", "Client gallery & documents"],
  ]) {
    await page
      .getByRole("tab", {
        name: label,
        exact: label === "Diary" || label === "Gallery",
      })
      .click()
    await expect(page).toHaveURL(new RegExp(`/clients/c1\\?tab=${tab}$`))
    await expect(page.getByText(title, { exact: true })).toBeVisible()
    await expect(page.getByText(/Phase 1C migration pending/)).toBeVisible()
    await page.reload()
    await expect(
      page.getByRole("tab", {
        name: label,
        exact: label === "Diary" || label === "Gallery",
      }),
    ).toHaveAttribute("aria-selected", "true")
  }
  await page.goto("/houses/h1")
  for (const [label, tab, title] of [
    ["House diary", "diary", "House diary"],
    ["Documents", "files", "House documents & gallery"],
    ["Notifications & concerns", "concerns", "House notifications & concerns"],
  ]) {
    await page.getByRole("tab", { name: label, exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`/houses/h1\\?tab=${tab}$`))
    if (tab === "diary")
      await expect(
        page.getByRole("link", { name: "New entry", exact: true }),
      ).toBeVisible()
    else await expect(page.getByRole("tabpanel")).toContainText(title)
  }
  await page.goBack()
  await expect(page).toHaveURL(/tab=files$/)
  await page.getByRole("tab", { name: "Overview", exact: true }).click()
  await page.getByRole("tab", { name: "Overview", exact: true }).focus()
  await page.keyboard.press("ArrowRight")
  await expect(
    page.getByRole("tab", { name: "House diary", exact: true }),
  ).toHaveAttribute("aria-selected", "true")
})
test("unknown and valid-but-unassigned URLs reject without identifying the record", async ({
  page,
  request,
}) => {
  for (const path of [
    "/houses/missing",
    "/houses/h3",
    "/clients/missing",
    "/clients/c4",
  ]) {
    const response = await request.get(path)
    expect(response.status()).toBe(404)
    const html = await response.text()
    for (const marker of [
      "Cedar Hill",
      "Unassigned Example",
      "Restricted Contact",
    ])
      expect(html).not.toContain(marker)
    await page.goto(path)
    await expect(
      page.getByRole("heading", { name: "Record could not be found" }),
    ).toBeVisible()
  }
})
test("photo and concern controls are honest preview-only interactions", async ({
  page,
}) => {
  await page.goto("/houses/h1")
  await page.getByRole("button", { name: "Update house photo" }).click()
  await expect(page.getByRole("dialog")).toContainText("No file or record")
  await page.keyboard.press("Escape")
  await client(page)
  await page
    .getByRole("button", { name: "Preview photo update for Taylor" })
    .click()
  await expect(page.getByRole("dialog")).toContainText(
    "Development preview only",
  )
  await expect(page.locator("input[type=file]")).toHaveCount(0)
  await page.getByRole("button", { name: "Close preview" }).click()
  await page.getByRole("button", { name: "Submit concern" }).click()
  await expect(page.getByRole("dialog")).toContainText("not implemented")
})
test("failed photo has an understandable fallback", async ({ page }) => {
  await page.route("https://images.unsplash.com/**", (r) =>
    r.fulfill({ status: 404, body: "unavailable" }),
  )
  await page.goto("/houses")
  await expect(page.getByText("Photo unavailable")).toHaveCount(2)
})
test("capture Phase 1B source comparisons and responsive layout", async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  await mkdir("test-results/phase-1b", { recursive: true })
  const capture = async (name: string) => {
    await page.evaluate(() => document.fonts.ready)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)
    await page.screenshot({
      animations: "disabled",
      style: "nextjs-portal { display: none !important; }",
      path: `test-results/phase-1b/${info.project.name}-${name}.png`,
    })
  }
  await page.goto("/houses")
  await expect(page.locator(".cm-house-card")).toHaveCount(2)
  await capture("migrated-houses")
  await page.locator(".cm-house-card").first().click()
  await expect(
    page.getByRole("heading", { name: "Riverside Lodge", exact: true }),
  ).toBeVisible()
  await capture("migrated-house")
  await page
    .locator(".cm-client-card")
    .filter({ hasText: "Taylor Reed" })
    .click()
  await expect(page.locator(".cm-profile-head h1")).toHaveText("Taylor Reed")
  await capture("migrated-client")
  await page
    .locator(".cm-content")
    .evaluate((el) => el.scrollTo(0, el.scrollHeight))
  await capture("migrated-contacts")
  await page.goto("/search?q=Riverside")
  await expect(page.locator(".cm-result")).toHaveCount(3)
  await capture("migrated-search")
  if (!hasUiReference) {
    expect(errors).toEqual([])
    return
  }
  await page.goto("http://localhost:8557/")
  await page
    .locator(".cm-sidebar-nav,.cm-bottom-nav")
    .getByRole("button", { name: "Houses", exact: true })
    .filter({ visible: true })
    .click()
  await expect(page.getByRole("heading", { name: "My houses" })).toBeVisible()
  await capture("original-houses")
  await page.locator(".cm-house-card").first().click()
  await expect(
    page.getByRole("heading", { name: "Riverside Lodge", exact: true }),
  ).toBeVisible()
  await capture("original-house")
  await page
    .locator(".cm-client-card")
    .filter({ hasText: "Taylor Reed" })
    .click()
  await expect(page.locator(".cm-profile-head h1")).toHaveText("Taylor Reed")
  await capture("original-client")
  await page
    .locator(".cm-content")
    .evaluate((el) => el.scrollTo(0, el.scrollHeight))
  await capture("original-contacts")
  await page
    .locator(".cm-sidebar-nav,.cm-bottom-nav")
    .getByRole("button", { name: "Search", exact: true })
    .filter({ visible: true })
    .click()
  await page.getByRole("searchbox").fill("Riverside")
  await expect(page.locator(".cm-result")).toHaveCount(3)
  await capture("original-search")
  expect(errors).toEqual([])
})
