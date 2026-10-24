import { test, expect } from "@playwright/test"
import { mkdir } from "node:fs/promises"
import { setup, tab, bounds } from "./documentation-helpers"
import { hasUiReference } from "../reference-availability"
test.use({ timezoneId: "Pacific/Auckland" })
test("representative governance source comparisons", async ({ page }, info) => {
  test.setTimeout(120000)
  page.setDefaultTimeout(10000)
  await setup(page)
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  const width = page.viewportSize()!.width
  await mkdir("test-results/phase-1e4b", { recursive: true })
  async function shot(side: string, state: string) {
    await page.evaluate(async () => {
      await document.fonts.ready
      document.querySelector(".ad-content")?.scrollTo(0, 0)
    })
    if (side === "migrated") await bounds(page)
    await page.screenshot({
      path: `test-results/phase-1e4b/${info.project.name}-${side}-${state}.png`,
      animations: "disabled",
    })
  }
  await page.goto("/login")
  await page
    .getByRole("button", { name: "Preview administration", exact: true })
    .click()
  if (width < 1024) {
    await expect(page.locator(".ad-desktop-guard")).toBeVisible()
    await shot("migrated", "desktop-notice")
    if (hasUiReference) {
      await page.goto("http://localhost:8557?screen=admin")
      await shot("original", "desktop-notice")
    }
    expect(errors).toEqual([])
    return
  }
  async function nav(name: string) {
    await page
      .locator(".ad-nav")
      .getByRole("link", { name: new RegExp(`^${name}`) })
      .click()
    await expect(page.getByRole("heading", { level: 1 })).toContainText(name)
  }
  await nav("Files & Galleries")
  await expect(page.locator("tbody tr").first()).toBeVisible()
  await shot("migrated", "file-directory")
  if (width === 1280) {
    await page
      .getByLabel("Search files", { exact: true })
      .fill("Demo garden illustration.png")
    await page
      .getByRole("link", { name: "Details / preview", exact: true })
      .click()
    await expect(
      page.getByRole("dialog", {
        name: "Demo garden illustration.png",
        exact: true,
      }),
    ).toBeVisible()
    await shot("migrated", "file-details")
    await page.getByRole("button", { name: "Remove file", exact: true }).click()
    await shot("migrated", "file-removal")
    await page
      .getByRole("dialog", {
        name: "Remove Demo garden illustration.png?",
        exact: true,
      })
      .getByRole("button", { name: "Cancel", exact: true })
      .click()
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Close", exact: true })
      .click()
    await nav("Notifications & Concerns")
    await expect(page.locator("tbody tr").first()).toBeVisible()
    await shot("migrated", "notification-directory")
    await page
      .getByRole("link", { name: "New notification", exact: true })
      .click()
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "New notification",
    )
    await page.getByLabel("Type", { exact: true }).selectOption("client")
    await page.getByLabel("Client", { exact: true }).selectOption("c1")
    await page
      .getByLabel("Title", { exact: true })
      .fill("Fictional client update")
    await page
      .getByLabel("Message", { exact: true })
      .fill("A fictional update for authorised client staff only.")
    await shot("migrated", "audience-editor")
    await page.getByRole("button", { name: "Publish", exact: true }).click()
    await shot("migrated", "publish-confirmation")
    await page
      .getByRole("button", { name: "Keep reviewing", exact: true })
      .click()
    await page.getByRole("button", { name: "Save draft", exact: true }).click()
    await expect(page).toHaveURL(/\/admin\/notifications\/.+\/edit$/)
  }
  await nav("Notifications & Concerns")
  await tab(page, "Concerns")
  await expect(page.locator("tbody tr").first()).toBeVisible()
  if (width === 1280) await shot("migrated", "concern-queue")
  await page
    .getByLabel("Search concerns", { exact: true })
    .fill("Fictional garden equipment check")
  await page.getByRole("link", { name: "Review", exact: true }).click()
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Fictional garden equipment check",
  )
  await shot("migrated", "concern-review")
  if (width === 1280) {
    await nav("Reports & Audit")
    await expect(
      page.getByRole("heading", {
        name: "Documentation by client",
        exact: true,
      }),
    ).toBeVisible()
    await shot("migrated", "reports")
    await tab(page, "Audit log")
    await expect(
      page.getByText("Development Audit Preview", { exact: true }),
    ).toBeVisible()
    await shot("migrated", "audit")
  }
  if (hasUiReference) {
    await page.goto("http://localhost:8557?screen=admin")
    const sourceNav = async (name: string) => {
      await page
        .locator(".ad-nav")
        .getByRole("button", { name: new RegExp(`^${name}`) })
        .click()
      await expect(page.getByRole("heading", { level: 1 })).toContainText(name)
    }
    await sourceNav("Files & Galleries")
    await expect(page.locator("tbody tr").first()).toBeVisible()
    await shot("original", "file-directory")
    if (width === 1280) {
      await page
        .getByRole("searchbox", { name: "Search", exact: true })
        .fill("Demo garden illustration.png")
      await page
        .getByRole("row")
        .filter({ hasText: "Demo garden illustration.png" })
        .click()
      await expect(page.getByRole("dialog")).toBeVisible()
      await shot("original", "file-details")
      await page
        .getByRole("button", { name: "Remove file", exact: true })
        .click()
      await shot("original", "file-removal")
      await page
        .getByRole("dialog", {
          name: "Remove Demo garden illustration.png?",
          exact: true,
        })
        .getByRole("button", { name: "Cancel", exact: true })
        .click()
      await page
        .locator(".ad-drawer-head")
        .getByRole("button", { name: "Close", exact: true })
        .click()
      await sourceNav("Notifications & Concerns")
      await shot("original", "notification-directory")
      await page
        .getByRole("button", { name: "New notification", exact: true })
        .click()
      await page
        .getByRole("combobox", { name: "Type", exact: true })
        .selectOption("client")
      await page
        .getByRole("combobox", { name: "Client", exact: true })
        .selectOption("c1")
      await page
        .getByRole("textbox", { name: "Title", exact: true })
        .fill("Fictional client update")
      await page
        .getByRole("textbox", { name: "Message", exact: true })
        .fill("A fictional update for authorised client staff only.")
      await shot("original", "audience-editor")
      await page.getByRole("button", { name: "Publish", exact: true }).click()
      await shot("original", "publish-confirmation")
      await page.getByRole("button", { name: "Cancel", exact: true }).click()
      await page
        .getByRole("button", { name: "Save draft", exact: true })
        .click()
      await page
        .getByRole("button", { name: "Discard and leave", exact: true })
        .click()
      await expect(page.locator(".ad-toast")).toHaveCount(0)
    }
    await sourceNav("Notifications & Concerns")
    await page.getByRole("tab", { name: /^Concerns/ }).click()
    if (width === 1280) await shot("original", "concern-queue")
    await page
      .getByRole("row")
      .filter({ hasText: "Fictional garden equipment check" })
      .click()
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Fictional garden equipment check",
    )
    await shot("original", "concern-review")
    if (width === 1280) {
      await sourceNav("Reports & Audit")
      await shot("original", "reports")
      await page.getByRole("tab", { name: "Audit log", exact: true }).click()
      await shot("original", "audit")
    }
  }
  expect(errors).toEqual([])
})
