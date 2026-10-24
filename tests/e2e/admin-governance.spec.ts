import { test, expect, type Page } from "@playwright/test"
import { mkdir } from "node:fs/promises"
import {
  setup,
  enter,
  tab,
  staffClient,
  backToAdmin,
  bounds,
} from "./documentation-helpers"
test.use({ timezoneId: "Pacific/Auckland" })
test.beforeEach(async ({ page }) => setup(page))
async function mobileEvidence(page: Page, state: string) {
  if (test.info().project.name !== "width-1280") return
  await mkdir("test-results/phase-1e4b", { recursive: true })
  await page.screenshot({
    path: `test-results/phase-1e4b/mobile-${state}.png`,
    animations: "disabled",
  })
}
async function nav(page: Page, name: string) {
  await page
    .locator(".ad-nav")
    .getByRole("link", { name: new RegExp(`^${name}`) })
    .click()
  await expect(page.getByRole("heading", { level: 1 })).toContainText(name)
}
async function staffNotifications(page: Page) {
  await page.locator(".ad-account").click()
  await page
    .getByRole("link", { name: "View Staff application", exact: true })
    .click()
  await expect(page).toHaveURL(/\/profile$/)
  await page
    .locator(".cm-sidebar")
    .getByRole("button", { name: /^Notifications/ })
    .click()
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Notifications",
  )
}
async function newNotice(page: Page, category = "house") {
  await nav(page, "Notifications & Concerns")
  await page
    .getByRole("link", { name: "New notification", exact: true })
    .click()
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "New notification",
  )
  await page.getByLabel("Type", { exact: true }).selectOption(category)
  await expect(page.getByLabel("Type", { exact: true })).toHaveValue(category)
  if (category !== "staff")
    await page
      .getByLabel(category === "house" ? "House" : "Client", { exact: true })
      .selectOption(category === "house" ? "h1" : "c1")
  await page
    .getByLabel("Title", { exact: true })
    .fill("Fictional management update")
  await page
    .getByLabel("Message", { exact: true })
    .fill("Fictional update configured by management for a limited audience.")
}
async function publish(page: Page) {
  await page.getByRole("button", { name: "Publish", exact: true }).click()
  await page
    .getByRole("button", { name: "Confirm publication", exact: true })
    .click()
  await expect(page.getByText(/Published notices are read-only/)).toBeVisible()
}
test("governance desktop gate, restricted access and malformed direct routes", async ({
  page,
}) => {
  const narrow = page.viewportSize()!.width < 1024
  for (const path of [
    "/admin/files?fileId=client-garden",
    "/admin/notifications/new",
    "/admin/concerns/concern-submitted",
    "/admin/reports?tab=audit",
  ]) {
    await page.goto(path)
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
  }
  for (const path of [
    "/admin/files?fileId=one&fileId=two",
    "/admin/files?action=remove",
    "/admin/notifications?tab=unknown",
    "/admin/notifications/new?publish=1",
    "/admin/notifications/n1/edit?action=publish",
    "/admin/concerns/concern-submitted?review=1",
    "/admin/reports?tab=audit&tab=reports",
  ])
    expect((await page.goto(path))?.status()).toBe(404)
})
test("shared file directory filters, details, confirmed logical removal and mobile Staff exclusion", async ({
  page,
}) => {
  test.skip(page.viewportSize()!.width < 1024, "Desktop management")
  await enter(page)
  await nav(page, "Files & Galleries")
  await expect(page.locator("tbody tr")).toHaveCount(12)
  await page.getByLabel("Client", { exact: true }).selectOption("c1")
  await page.getByLabel("Type", { exact: true }).selectOption("image")
  await expect(page.locator("tbody tr")).toHaveCount(3)
  await page.getByLabel("Search files", { exact: true }).fill("Demo garden")
  await page
    .getByRole("link", { name: "Details / preview", exact: true })
    .click()
  const drawer = page.getByRole("dialog", {
    name: "Demo garden illustration.png",
    exact: true,
  })
  await expect(
    drawer.getByRole("img", {
      name: "Demo garden illustration.png",
      exact: true,
    }),
  ).toBeVisible()
  await drawer.getByRole("button", { name: "Remove file", exact: true }).click()
  const confirmation = page.getByRole("dialog", {
    name: "Remove Demo garden illustration.png?",
    exact: true,
  })
  await confirmation
    .getByRole("button", { name: "Confirm removal", exact: true })
    .click()
  await expect(confirmation.getByRole("alert")).toContainText("reason")
  await confirmation
    .getByLabel("Reason for removal", { exact: true })
    .fill("Fictional removal test")
  await confirmation
    .getByRole("button", { name: "Confirm removal", exact: true })
    .click()
  await expect(drawer).toContainText("Logically removed")
  await expect(drawer).toContainText("Fictional removal test")
  await expect(drawer.getByRole("link", { name: /Download/ })).toHaveCount(0)
  await drawer.getByRole("button", { name: "Close", exact: true }).click()
  await staffClient(page)
  await page.getByRole("tab", { name: /Gallery/ }).click()
  await page.getByLabel("Search filenames", { exact: true }).fill("Demo garden")
  await expect(
    page.getByText("No matching files", { exact: true }),
  ).toBeVisible()
  await expect(page.getByRole("button", { name: /Remove file/ })).toHaveCount(0)
  await page.setViewportSize({ width: 390, height: 900 })
  await bounds(page)
  await mobileEvidence(page, "file-removal")
})
test("Admin exact client and house galleries reuse selection validation failure cancel and metadata completion", async ({
  page,
}) => {
  test.skip(page.viewportSize()!.width < 1024, "Desktop management")
  await enter(page)
  await nav(page, "Clients")
  await page.getByRole("row").filter({ hasText: "Taylor Reed" }).click()
  await tab(page, "Gallery / Documents")
  await expect(page.locator(".ad-gallery")).toContainText(
    "Demo garden illustration.png",
  )
  await expect(page.locator(".ad-gallery")).not.toContainText(
    "House demo garden",
  )
  await page.getByRole("button", { name: "Upload", exact: true }).click()
  let d = page.getByRole("dialog", {
    name: "Upload file · development preview",
    exact: true,
  })
  await d
    .getByLabel("Select demonstration files", { exact: true })
    .setInputFiles({
      name: "active.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from("<svg/>"),
    })
  await expect(d.getByRole("alert")).toBeVisible()
  await d
    .getByRole("button", { name: /Remove active.svg from selection/ })
    .click()
  await d
    .getByLabel("Select demonstration files", { exact: true })
    .setInputFiles({
      name: "Fictional Admin selection.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("fictional"),
    })
  await d
    .getByLabel("Demo upload outcome", { exact: true })
    .selectOption("failure")
  await d.getByRole("button", { name: /Simulate upload/ }).click()
  await expect(
    d.getByText("Simulated upload failed", { exact: true }),
  ).toBeVisible()
  await d
    .getByLabel("Demo upload outcome", { exact: true })
    .selectOption("success")
  await d.getByRole("button", { name: /Retry simulated upload/ }).click()
  await expect(d.getByText(/Development preview completed:/)).toBeVisible()
  await d.getByRole("button", { name: "Close selection", exact: true }).click()
  await expect(page.locator(".ad-gallery")).toContainText(
    "Fictional Admin selection.txt",
  )
  await nav(page, "Houses")
  await page
    .getByRole("button", { name: /Riverside Lodge/ })
    .first()
    .click()
  await tab(page, "Files & photos")
  await expect(page.locator(".ad-gallery")).toContainText("House demo garden")
  await expect(page.locator(".ad-gallery")).not.toContainText(
    "Fictional Admin selection.txt",
  )
  await page.getByRole("button", { name: "Upload", exact: true }).click()
  d = page.getByRole("dialog", {
    name: "Upload file · development preview",
    exact: true,
  })
  await d.getByLabel("Select demonstration files").setInputFiles({
    name: "cancel.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("fictional"),
  })
  await d.getByRole("button", { name: "Cancel selection", exact: true }).click()
  await expect(
    d.getByText("Selection cancelled. Nothing was uploaded."),
  ).toBeVisible()
  await d.getByRole("button", { name: "Close selection", exact: true }).click()
  await bounds(page)
})
test("house notice draft edit publish read state Staff feed and controlled withdrawal share one session", async ({
  page,
}) => {
  test.skip(page.viewportSize()!.width < 1024, "Desktop management")
  await enter(page)
  await newNotice(page)
  await page.getByRole("button", { name: "Save draft", exact: true }).click()
  await expect(page).toHaveURL(/\/admin\/notifications\/.+\/edit$/)
  await page
    .getByLabel("Title", { exact: true })
    .fill("Fictional revised house notice")
  await page.getByRole("button", { name: "Save draft", exact: true }).click()
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Fictional revised house notice",
  )
  await publish(page)
  await expect(page.getByLabel("Message", { exact: true })).toBeDisabled()
  await staffNotifications(page)
  const card = page
    .locator(".cm-official-notice")
    .filter({ hasText: "Fictional revised house notice" })
  await expect(card).toContainText("Unread")
  await card.click()
  await expect(page.getByRole("dialog")).toContainText(
    "Fictional update configured by management",
  )
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Close notice", exact: true })
    .click()
  await expect(card).toContainText("Read")
  await backToAdmin(page)
  await page
    .getByRole("button", { name: "Withdraw notice", exact: true })
    .click()
  await page
    .getByRole("button", { name: "Confirm withdrawal", exact: true })
    .click()
  await expect(page.getByText(/Withdrawn — hidden/)).toBeVisible()
  await staffNotifications(page)
  await expect(
    page
      .locator(".cm-official-notice")
      .filter({ hasText: "Fictional revised house notice" }),
  ).toHaveCount(0)
})
test("client audience validation and publication reach contextual mobile Staff notice", async ({
  page,
}) => {
  test.skip(page.viewportSize()!.width < 1024, "Desktop management")
  await enter(page)
  await newNotice(page, "client")
  await page
    .getByLabel("Target audience", { exact: true })
    .selectOption("employee")
  await page.getByLabel("Employee audience", { exact: true }).selectOption("s4")
  await page.getByRole("button", { name: "Publish", exact: true }).click()
  await expect(page.locator(".ad-content").getByRole("alert")).toContainText(
    "not assigned",
  )
  await page
    .getByLabel("Target audience", { exact: true })
    .selectOption("client")
  await publish(page)
  await staffClient(page)
  await page.getByRole("tab", { name: "Overview", exact: true }).click()
  await expect(page).toHaveURL(/tab=overview/)
  await expect(
    page
      .locator(".cm-official-notice")
      .filter({ hasText: "Fictional management update" }),
  ).toBeVisible()
  await page.setViewportSize({ width: 375, height: 900 })
  await bounds(page)
  await page
    .locator(".cm-official-notice")
    .filter({ hasText: "Fictional management update" })
    .scrollIntoViewIfNeeded()
  await mobileEvidence(page, "client-notice")
})
test("Staff-submitted concern management private notes response resolve and author outcome", async ({
  page,
}) => {
  test.skip(page.viewportSize()!.width < 1024, "Desktop management")
  await enter(page)
  await staffNotifications(page)
  await page
    .getByRole("button", { name: "Submit concern", exact: true })
    .click()
  await page
    .getByLabel("Concern context", { exact: true })
    .selectOption("client")
  await page
    .getByLabel("Related client or house", { exact: true })
    .selectOption("c1")
  await page
    .getByLabel("Concern title", { exact: true })
    .fill("Fictional new management review")
  await page
    .getByLabel("Description", { exact: true })
    .fill("Original fictional observation remains unchanged.")
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Submit concern", exact: true })
    .click()
  await expect(page.getByRole("dialog")).toContainText(
    "Original fictional observation",
  )
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Close concern", exact: true })
    .click()
  await backToAdmin(page)
  await nav(page, "Notifications & Concerns")
  await tab(page, "Concerns")
  await page
    .getByLabel("Search concerns", { exact: true })
    .fill("Fictional new management review")
  await page.getByRole("link", { name: "Review", exact: true }).click()
  await page
    .getByLabel("Review text", { exact: true })
    .fill("INTERNAL PRIVATE NEW NOTE")
  await page
    .getByRole("button", { name: "Add internal note", exact: true })
    .click()
  await page.getByRole("button", { name: "Start review", exact: true }).click()
  await page
    .getByRole("button", { name: "Confirm review", exact: true })
    .click()
  await page
    .getByLabel("Review text", { exact: true })
    .fill("Fictional author-visible resolution")
  await page.getByRole("button", { name: "Resolve", exact: true }).click()
  await page
    .getByRole("button", { name: "Confirm review", exact: true })
    .click()
  await expect(page.locator(".ad-content")).toContainText("Resolved")
  await staffNotifications(page)
  await page.getByRole("tab", { name: /^My concerns/ }).click()
  await page
    .getByLabel("Search own concerns", { exact: true })
    .fill("Fictional new management review")
  await page
    .locator(".cm-concern-item")
    .filter({ hasText: "Fictional new management review" })
    .click()
  await expect(page.getByRole("dialog")).toContainText(
    "Fictional author-visible resolution",
  )
  await expect(page.getByRole("dialog")).toContainText(
    "Original fictional observation",
  )
  await expect(page.locator("body")).not.toContainText(
    "INTERNAL PRIVATE NEW NOTE",
  )
  await page.setViewportSize({ width: 390, height: 900 })
  await bounds(page)
  await mobileEvidence(page, "concern-outcome")
})
test("Reports and Development Audit Preview expose bounded metadata with unavailable exports", async ({
  page,
}) => {
  test.skip(page.viewportSize()!.width < 1024, "Desktop management")
  await enter(page)
  await nav(page, "Reports & Audit")
  await expect(
    page.getByRole("heading", { name: "Documentation by client", exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole("button", {
      name: "Export CSV · Future Development",
      exact: true,
    }),
  ).toHaveCount(4)
  for (const b of await page
    .getByRole("button", {
      name: "Export CSV · Future Development",
      exact: true,
    })
    .all())
    await expect(b).toBeDisabled()
  await tab(page, "Audit log")
  await expect(
    page.getByText("Development Audit Preview", { exact: true }),
  ).toBeVisible()
  await expect(page.locator(".ad-content")).toContainText(
    "not immutable, tamper-proof",
  )
  await expect(
    page.getByRole("button", {
      name: "Export · Future Development",
      exact: true,
    }),
  ).toBeDisabled()
  await page
    .getByLabel("Search actions", { exact: true })
    .fill("does not exist")
  await expect(
    page.getByText("No available development events", { exact: true }),
  ).toBeVisible()
  await bounds(page)
})
