import { expect, type Page } from "@playwright/test"
export async function setup(page: Page) {
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
}
export async function enter(page: Page) {
  await page.goto("/login")
  await page
    .getByRole("button", { name: "Preview administration", exact: true })
    .click()
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Kia ora")
  await page
    .locator(".ad-nav")
    .getByRole("link", { name: /^Care Documentation/ })
    .click()
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Care Documentation",
  )
}
export async function tab(page: Page, name: string) {
  const button = page.getByRole("tab", {
    name: new RegExp(`^${name}( *[0-9]+)?$`),
  })
  await button.click()
  await expect(button).toHaveAttribute("aria-selected", "true")
}
export async function create(page: Page, kind: "care" | "chart", name: string) {
  await tab(
    page,
    kind === "care" ? "Care Plan templates" : "Charting templates",
  )
  await page
    .getByRole("button", { name: "Create Template", exact: true })
    .click()
  const d = page.getByRole("dialog", { name: "Create Template", exact: true })
  await d.getByLabel("Template name", { exact: true }).fill(name)
  await d
    .getByLabel("Description", { exact: true })
    .fill("Fictional configuration only")
  await d.getByRole("button", { name: "Create draft", exact: true }).click()
  await expect(page.locator(".ad-builder")).toBeVisible()
  return new URL(page.url()).pathname.split("/").at(-1)!
}
export async function section(page: Page, name = "Observations") {
  await page.getByRole("button", { name: "Add section", exact: true }).click()
  await page.getByLabel("Section title", { exact: true }).fill(name)
}
export async function field(page: Page, type: string, label: string) {
  await page
    .locator(".ad-palette")
    .getByRole("button", { name: type, exact: true })
    .click()
  await page.getByLabel("Field label", { exact: true }).fill(label)
}
export async function publish(page: Page, version = 1) {
  await page.getByRole("button", { name: "Validate", exact: true }).click()
  await expect(
    page.getByText("Template is valid for publication", { exact: true }),
  ).toBeVisible()
  await page
    .getByRole("button", { name: `Publish v${version}`, exact: true })
    .click()
  await page
    .getByRole("button", { name: "Confirm Publish", exact: true })
    .click()
  await expect(
    page.getByText("Published versions are locked", { exact: true }),
  ).toBeVisible()
}
export async function assign(page: Page) {
  await tab(page, "Assign to clients")
  await page.getByLabel("Select Taylor Reed", { exact: true }).check()
  await page
    .getByRole("button", { name: "Assign selected clients", exact: true })
    .click()
  await page
    .getByRole("button", { name: "Confirm assignment", exact: true })
    .click()
  await expect(
    page.getByRole("row").filter({ hasText: "Taylor Reed" }),
  ).toContainText("Active")
}
export async function staffClient(page: Page, kind = "care") {
  await page.locator(".ad-account").click()
  await page
    .getByRole("link", { name: "View Staff application", exact: true })
    .click()
  await expect(page).toHaveURL(/\/profile$/)
  await page
    .locator(".cm-sidebar")
    .getByRole("button", { name: "Home", exact: true })
    .click()
  await page
    .locator(".cm-client-card")
    .filter({ hasText: "Taylor Reed" })
    .click()
  await page
    .getByRole("tab", {
      name:
        kind === "care" ? /Care Plan/ : kind === "chart" ? /Charting/ : /Diary/,
    })
    .click()
}
export async function backToAdmin(page: Page) {
  for (
    let i = 0;
    i < 25 && !new URL(page.url()).pathname.startsWith("/admin/");
    i++
  )
    await page.goBack()
  await expect(page.locator(".ad-nav")).toBeVisible()
}
export async function bounds(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true)
}
export async function captureStaff(page: Page, width: string, state: string) {
  const { mkdir } = await import("node:fs/promises")
  await mkdir("test-results/phase-1e3", { recursive: true })
  await page.evaluate(async () => {
    await document.fonts.ready
  })
  if (state === "staff-care" || state === "staff-chart")
    await page.screenshot({
      path: `test-results/phase-1e3/${width}-migrated-${state}-fields.png`,
      animations: "disabled",
    })
  await page.locator(".cm-content").evaluate((el) => el.scrollTo(0, 0))
  await page.screenshot({
    path: `test-results/phase-1e3/${width}-migrated-${state}.png`,
    animations: "disabled",
  })
}
