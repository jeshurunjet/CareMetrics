import { test, expect } from "@playwright/test"
import { mkdir } from "node:fs/promises"
import { hasUiReference } from "../reference-availability"
test.use({ timezoneId: "Pacific/Auckland" })
test("capture Admin core screens against the preserved source", async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
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
  await mkdir("test-results/phase-1e1", { recursive: true })
  const capture = async (side: string, name: string) => {
    const headings: Record<string, string> = {
      dashboard: "Kia ora, Example",
      employees: "Employees",
      "employee-create": "Create employee",
      "employee-edit": "Edit Jamie Taufa",
      "employee-detail": "Jamie Taufa",
      houses: "Houses",
      "house-create": "Create house",
      "house-edit": "Edit Riverside Lodge",
      "house-detail": "Riverside Lodge",
      clients: "Clients",
      "client-create": "Create client",
      "client-edit": "Edit Taylor Reed",
      "client-detail": "Taylor Reed",
      contacts: "Taylor Reed",
    }
    if (name === "desktop-notice")
      await expect(page.locator(".ad-desktop-guard")).toBeVisible()
    else if (name === "assignments")
      await expect(
        page.getByRole("dialog", {
          name: "Assign houses — Jamie Taufa",
          exact: true,
        }),
      ).toBeVisible()
    else {
      await expect(page.getByRole("heading", { level: 1 })).toContainText(
        headings[name],
      )
      if (name.endsWith("-create") || name.endsWith("-edit"))
        await expect(page.locator(".ad-form-layout")).toBeVisible()
      if (name === "contacts")
        await expect(page.locator(".ad-contact-row")).toHaveCount(2)
      if (name === "houses")
        await expect(page.locator(".ad-house-card")).toHaveCount(3)
    }
    await expect
      .poll(() =>
        page
          .locator(".ad-photo-lg,.ad-banner-img,.ad-house-card-img img")
          .evaluateAll((nodes) =>
            nodes.every((node) => {
              const img = node as HTMLImageElement
              return img.complete && img.naturalWidth > 0
            }),
          ),
      )
      .toBe(true)
    await page.evaluate(async () => {
      await document.fonts.ready
      document.querySelector(".ad-content")?.scrollTo(0, 0)
    })
    if (side === "migrated")
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true)
    await page.screenshot({
      path: `test-results/phase-1e1/${info.project.name}-${side}-${name}.png`,
      animations: "disabled",
    })
  }
  const migratedNav = async (label: string) => {
    await page
      .locator(".ad-nav")
      .getByRole("link", { name: label, exact: true })
      .click()
  }
  const originalNav = async (label: string) => {
    await page
      .locator(".ad-nav")
      .getByRole("button", { name: label, exact: true })
      .click()
  }
  const row = async (name: string) => {
    const tr = page.getByRole("row").filter({ hasText: name })
    await expect(tr).toBeVisible()
    await tr.click()
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
      await expect(page.locator(".ad-desktop-guard")).toBeVisible()
      await capture("original", "desktop-notice")
    }
    expect(errors).toEqual([])
    return
  }
  await expect(
    page.getByRole("heading", { name: "Kia ora, Example", exact: true }),
  ).toBeVisible()
  await capture("migrated", "dashboard")
  await migratedNav("Employees")
  await expect(
    page.getByRole("row").filter({ hasText: "Jamie Taufa" }),
  ).toBeVisible()
  await capture("migrated", "employees")
  await page
    .getByRole("button", { name: "Create employee", exact: true })
    .click()
  await capture("migrated", "employee-create")
  await page.getByRole("button", { name: "Cancel", exact: true }).click()
  await row("Jamie Taufa")
  await capture("migrated", "employee-detail")
  await page.getByRole("button", { name: "Edit employee", exact: true }).click()
  await capture("migrated", "employee-edit")
  await page.getByRole("button", { name: "Cancel", exact: true }).click()
  await page.getByRole("tab", { name: /House assignments/ }).click()
  await page
    .getByRole("button", { name: "Manage assignments", exact: true })
    .click()
  await capture("migrated", "assignments")
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel", exact: true })
    .click()
  await migratedNav("Houses")
  await capture("migrated", "houses")
  await page.getByRole("button", { name: "Create house", exact: true }).click()
  await capture("migrated", "house-create")
  await page.getByRole("button", { name: "Cancel", exact: true }).click()
  await page.getByRole("button", { name: /Riverside Lodge/ }).click()
  await capture("migrated", "house-detail")
  await page.getByRole("button", { name: "Edit house", exact: true }).click()
  await capture("migrated", "house-edit")
  await page.getByRole("button", { name: "Cancel", exact: true }).click()
  await migratedNav("Clients")
  await expect(
    page.getByRole("row").filter({ hasText: "Taylor Reed" }),
  ).toBeVisible()
  await capture("migrated", "clients")
  await page.getByRole("button", { name: "Create client", exact: true }).click()
  await capture("migrated", "client-create")
  await page.getByRole("button", { name: "Cancel", exact: true }).click()
  await row("Taylor Reed")
  await capture("migrated", "client-detail")
  await page.getByRole("button", { name: "Edit client", exact: true }).click()
  await capture("migrated", "client-edit")
  await page.getByRole("button", { name: "Cancel", exact: true }).click()
  await page.getByRole("tab", { name: /Contacts \/ NOK/ }).click()
  await page.getByRole("button", { name: "Edit contacts", exact: true }).click()
  await capture("migrated", "contacts")
  if (hasUiReference) {
    await page.goto("http://localhost:8557?screen=admin")
    await expect(page.getByRole("heading", { name: /Kia ora/ })).toBeVisible()
    await expect(
      page.getByRole("row").filter({ hasText: "Jamie Taufa" }).first(),
    ).toBeVisible()
    await capture("original", "dashboard")
    await originalNav("Employees")
    await expect(
      page.getByRole("row").filter({ hasText: "Jamie Taufa" }),
    ).toBeVisible()
    await capture("original", "employees")
    await page
      .getByRole("button", { name: "Create employee", exact: true })
      .click()
    await capture("original", "employee-create")
    await page.getByRole("button", { name: "Cancel", exact: true }).click()
    await row("Jamie Taufa")
    await capture("original", "employee-detail")
    await page.getByRole("button", { name: "Edit", exact: true }).click()
    await capture("original", "employee-edit")
    await page.getByRole("button", { name: "Cancel", exact: true }).click()
    await page.getByRole("tab", { name: /House assignments/ }).click()
    await page
      .getByRole("button", { name: "Manage assignments", exact: true })
      .click()
    await capture("original", "assignments")
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Cancel", exact: true })
      .click()
    await originalNav("Houses")
    await expect(page.locator(".ad-house-card").first()).toBeVisible()
    await capture("original", "houses")
    await page
      .getByRole("button", { name: "Create house", exact: true })
      .click()
    await capture("original", "house-create")
    await page.getByRole("button", { name: "Cancel", exact: true }).click()
    await page.getByRole("button", { name: /Riverside Lodge/ }).click()
    await capture("original", "house-detail")
    await page.getByRole("button", { name: "Edit house", exact: true }).click()
    await capture("original", "house-edit")
    await page.getByRole("button", { name: "Cancel", exact: true }).click()
    await originalNav("Clients")
    await expect(
      page.getByRole("row").filter({ hasText: "Taylor Reed" }),
    ).toBeVisible()
    await capture("original", "clients")
    await page
      .getByRole("button", { name: "Create client", exact: true })
      .click()
    await capture("original", "client-create")
    await page.getByRole("button", { name: "Cancel", exact: true }).click()
    await row("Taylor Reed")
    await capture("original", "client-detail")
    await page.getByRole("button", { name: "Edit client", exact: true }).click()
    await capture("original", "client-edit")
    await page.getByRole("button", { name: "Cancel", exact: true }).click()
    await page.getByRole("tab", { name: /Contacts \/ NOK/ }).click()
    await page
      .getByRole("button", { name: "Edit contacts", exact: true })
      .click()
    await capture("original", "contacts")
  }
  expect(errors).toEqual([])
})
