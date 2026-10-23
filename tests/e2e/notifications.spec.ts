import { test, expect, type Page } from "@playwright/test"
import { mkdir } from "node:fs/promises"
import { hasUiReference } from "../reference-availability"
test.use({ timezoneId: "Pacific/Auckland" })
test.beforeEach(async ({ page }) => {
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
})
async function bounds(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true)
}
async function submitForm(page: Page) {
  await page
    .getByLabel("Concern context", { exact: true })
    .selectOption("client")
  await page
    .getByLabel("Related client or house", { exact: true })
    .selectOption("c1")
  await page
    .getByLabel("Concern title", { exact: true })
    .fill("Fictional new concern")
  await page
    .getByLabel("Description", { exact: true })
    .fill("Fictional observation for the demonstration only.")
}
test("overview, categories and newest-first cards expose only scoped official notices", async ({
  page,
}) => {
  await page.goto("/notifications")
  const cards = page.locator(".cm-official-notice")
  await expect(cards).toHaveCount(3)
  await expect(cards.first()).toContainText("Riverside team handover")
  await expect(page.locator("[data-unread-count]")).toHaveText(
    "2 unread notifications",
  )
  for (const [tab, title] of [
    ["Client", "Updated support information"],
    ["House", "Riverside team handover"],
    ["Staff", "Team meeting reminder"],
  ]) {
    await page.getByRole("tab", { name: tab, exact: true }).click()
    await expect(cards).toHaveCount(1)
    await expect(cards).toContainText(title)
    await expect(cards).toContainText("View details")
    await expect(cards).toContainText(tab === "Staff" ? "Read" : "Unread")
    await page.reload()
    await expect(
      page.getByRole("tab", { name: tab, exact: true }),
    ).toHaveAttribute("aria-selected", "true")
  }
  await expect(page.getByText("Private employee notice")).toHaveCount(0)
  await bounds(page)
})
test("notice search, NZ date and unread filters preserve accessible category keyboard navigation", async ({
  page,
}) => {
  await page.goto("/notifications")
  await page.getByLabel("Search notifications", { exact: true }).fill("Jordan")
  await expect(page.locator(".cm-official-notice")).toHaveCount(1)
  await page
    .getByLabel("Search notifications", { exact: true })
    .fill("no matching example")
  await expect(
    page.getByText("No matching results", { exact: true }),
  ).toBeVisible()
  await page.getByRole("button", { name: "Clear search", exact: true }).click()
  await page
    .getByLabel("Notifications from", { exact: true })
    .fill("2026-10-23")
  await expect(page.locator(".cm-official-notice")).toHaveCount(0)
  await page.getByLabel("Notifications from", { exact: true }).fill("")
  await page
    .getByLabel("Notification read filter", { exact: true })
    .selectOption("unread")
  await expect(page.locator(".cm-official-notice")).toHaveCount(2)
  await page.getByRole("tab", { name: /^All/ }).focus()
  await page.keyboard.press("ArrowRight")
  await expect(
    page.getByRole("tab", { name: "Client", exact: true }),
  ).toHaveAttribute("aria-selected", "true")
  await bounds(page)
})
test("opening details marks only own read, updates shell and Dashboard, and context links navigate", async ({
  page,
}) => {
  await page.goto("/dashboard")
  await expect(page.locator("[data-unread-count]")).toContainText("2 unread")
  await page.getByRole("button", { name: /Riverside team handover/ }).click()
  await expect(page.getByRole("dialog")).toContainText(
    "Read · your development session",
  )
  await expect(page.locator("[data-unread-count]")).toContainText("1 unread")
  if (page.viewportSize()!.width < 1024)
    await expect(
      page.getByRole("button", {
        name: "Notifications, 1 unread",
        exact: true,
      }),
    ).toBeVisible()
  else
    await expect(
      page
        .locator(".cm-sidebar-nav")
        .getByRole("button", { name: /Notifications/ }),
    ).toContainText("1")
  await page.getByRole("button", { name: "Close", exact: true }).click()
  await page
    .getByRole("navigation", { name: "Breadcrumb" })
    .getByRole("button", { name: "Dashboard", exact: true })
    .click()
  await expect(page.locator("[data-unread-count]")).toContainText("1 unread")
  await page
    .getByRole("button", { name: /Updated support information/ })
    .click()
  await expect(page.getByRole("dialog")).toContainText("Jordan Quinn")
  await expect(
    page.getByRole("link", { name: "Download public demonstration file" }),
  ).toHaveAttribute("href", "/demo-assets/public-demo-readme.txt")
  await page
    .getByRole("button", { name: "Open Client Profile", exact: true })
    .click()
  await expect(page).toHaveURL(/\/clients\/c3$/)
  await page.goBack()
  await expect(page.getByRole("dialog")).toBeVisible()
  await page.reload()
  await expect(page.getByRole("dialog")).toBeVisible()
  await bounds(page)
})
test("client and house contextual notices stay separate and concern actions preselect authorised subjects", async ({
  page,
}) => {
  await page.goto("/clients/c3")
  await expect(
    page.getByRole("region", { name: "client official notices" }),
  ).toContainText("Updated support information")
  await expect(
    page.getByRole("region", { name: "client official notices" }),
  ).not.toContainText("Riverside team handover")
  await page
    .getByRole("button", { name: "Submit concern", exact: true })
    .click()
  await expect(page.getByLabel("Concern context", { exact: true })).toHaveValue(
    "client",
  )
  await expect(
    page.getByLabel("Related client or house", { exact: true }),
  ).toHaveValue("c3")
  await page.getByRole("button", { name: "Cancel", exact: true }).click()
  await page.goto("/houses/h1?tab=concerns")
  await expect(
    page.getByRole("region", { name: "house official notices" }),
  ).toContainText("Riverside team handover")
  await page
    .getByRole("button", { name: "Submit concern", exact: true })
    .click()
  await expect(page.getByLabel("Concern context", { exact: true })).toHaveValue(
    "house",
  )
  await expect(
    page.getByLabel("Related client or house", { exact: true }),
  ).toHaveValue("h1")
  await page.getByRole("button", { name: "Cancel", exact: true }).click()
  await page.goto("/houses/h2?tab=concerns")
  await expect(
    page.getByRole("region", { name: "house official notices" }),
  ).toContainText("No notifications")
  await page.goto("/clients/c2")
  await expect(
    page.getByRole("region", { name: "client official notices" }),
  ).toContainText("No notifications")
  await bounds(page)
})
test("concern validation, author and target selectors exclude unrelated subjects", async ({
  page,
}) => {
  await page.goto("/notifications?action=new")
  const dialog = page.getByRole("dialog")
  await expect(
    page.getByLabel("Submitting employee", { exact: true }),
  ).toHaveValue("Jamie Taufa")
  await expect(
    page.getByLabel("Submitting employee", { exact: true }),
  ).toHaveAttribute("readonly", "")
  await dialog
    .getByRole("button", { name: "Submit concern", exact: true })
    .click()
  for (const message of [
    "Choose Client or House.",
    "Select an authorised client or house.",
    "Enter a short title.",
    "Describe the concern.",
  ])
    await expect(dialog.getByText(message, { exact: true })).toBeVisible()
  await page
    .getByLabel("Concern context", { exact: true })
    .selectOption("client")
  await expect(
    page
      .getByLabel("Related client or house", { exact: true })
      .locator("option"),
  ).toHaveCount(4)
  await page
    .getByLabel("Concern context", { exact: true })
    .selectOption("house")
  await expect(
    page
      .getByLabel("Related client or house", { exact: true })
      .locator("option"),
  ).toHaveCount(3)
  await page.getByRole("button", { name: "High", exact: true }).click()
  await expect(dialog).toContainText(
    "does not replace your organisation's urgent incident or emergency procedures",
  )
  await expect(
    dialog.getByRole("button", { name: /Publish|Resolve|Approve/ }),
  ).toHaveCount(0)
  await bounds(page)
})
test("own submission creates Submitted history and metadata, leaves notices unchanged and resets on reload", async ({
  page,
}) => {
  await page.goto("/notifications?action=new")
  await submitForm(page)
  await page
    .getByLabel("Supporting file (optional)", { exact: true })
    .setInputFiles({
      name: "example.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("public fictional example"),
    })
  await expect(page.getByRole("dialog")).toContainText("selected metadata")
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Submit concern", exact: true })
    .click()
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "not delivered to real management" }),
  ).toBeVisible()
  const dialog = page.getByRole("dialog")
  await expect(dialog).toContainText("Fictional new concern")
  await expect(dialog).toContainText("Submitted")
  await expect(dialog).toContainText("Jamie Taufa")
  await expect(dialog).toContainText("Taylor Reed")
  await expect(dialog).toContainText("contents were not retained")
  await page.getByRole("button", { name: "Close", exact: true }).click()
  await expect(page.locator(".cm-concern-item").first()).toContainText(
    "Fictional new concern",
  )
  await page.getByRole("tab", { name: /^All/ }).click()
  await expect(page.locator(".cm-official-notice")).toHaveCount(3)
  await page.getByRole("tab", { name: /My concerns/ }).click()
  await page.getByRole("button", { name: /Fictional new concern/ }).click()
  await expect(page).toHaveURL(/concernId=/)
  await expect(page.getByRole("dialog")).toContainText("Fictional new concern")
  await page.reload()
  await expect(page.getByRole("dialog")).toContainText("Concern unavailable")
  await bounds(page)
})
test("supporting selection reuses file policy, removal and cancel protect unsent work", async ({
  page,
}) => {
  await page.goto("/notifications?action=new")
  await page
    .getByLabel("Supporting file (optional)", { exact: true })
    .setInputFiles({
      name: "bad.html",
      mimeType: "text/html",
      buffer: Buffer.from("example"),
    })
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "Unsupported file type",
  )
  await page
    .getByLabel("Supporting file (optional)", { exact: true })
    .setInputFiles({
      name: "example.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("example"),
    })
  await page
    .getByRole("button", { name: "Remove selection", exact: true })
    .click()
  await expect(page.getByText("selected metadata")).toHaveCount(0)
  const title = page.getByLabel("Concern title", { exact: true })
  await title.pressSequentially("Fictional typed concern")
  await expect(title).toBeFocused()
  await expect(title).toHaveValue("Fictional typed concern")
  page.once("dialog", (d) => d.dismiss())
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog")).toBeVisible()
  await title.focus()
  await page.keyboard.press("Shift+Tab")
  await expect(page.getByRole("dialog").locator(":focus")).toHaveCount(1)
  page.once("dialog", (d) => d.accept())
  await page.getByRole("button", { name: "Cancel", exact: true }).click()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await bounds(page)
})
test("own concern history and details show four statuses and shared responses with no management controls", async ({
  page,
}) => {
  await page.goto("/notifications?tab=concerns")
  await expect(page.locator(".cm-concern-item")).toHaveCount(4)
  await expect(page.locator(".cm-concern-item").first()).toContainText(
    "garden equipment",
  )
  await page
    .getByLabel("Concern status", { exact: true })
    .selectOption("Under Review")
  await expect(page.locator(".cm-concern-item")).toHaveCount(1)
  await page.locator(".cm-concern-item").click()
  await expect(page.getByRole("dialog")).toContainText(
    "reviewing the demonstration arrangements",
  )
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: /Resolve|Publish|Delete|Review/ }),
  ).toHaveCount(0)
  await page.getByRole("button", { name: "Close", exact: true }).click()
  await page.getByLabel("Concern status", { exact: true }).selectOption("")
  await page
    .getByLabel("History context", { exact: true })
    .selectOption("house")
  await expect(page.locator(".cm-concern-item")).toHaveCount(3)
  await page.getByLabel("Search own concerns", { exact: true }).fill("cupboard")
  await expect(page.locator(".cm-concern-item")).toHaveCount(1)
  await page.locator(".cm-concern-item").click()
  await expect(page.getByRole("dialog")).toContainText("Resolved")
  await expect(page.getByRole("dialog")).toContainText("repair is complete")
  await page.getByRole("button", { name: "Close", exact: true }).click()
  await page
    .getByLabel("Notifications from", { exact: true })
    .fill("2026-10-23")
  await expect(
    page.getByText("No concerns submitted", { exact: true }),
  ).toBeVisible()
  await page.goto("/notifications?tab=concerns&context=house&targetId=h1")
  await expect(page.getByLabel("History context", { exact: true })).toHaveValue(
    "house",
  )
  await expect(
    page.getByLabel("History context", { exact: true }),
  ).toBeDisabled()
  await expect(page.locator(".cm-concern-item")).toHaveCount(2)
  await page
    .getByRole("button", { name: "Clear context filter", exact: true })
    .click()
  await expect(
    page.getByLabel("History context", { exact: true }),
  ).toBeEnabled()
  await expect(page.locator(".cm-concern-item")).toHaveCount(4)
  await bounds(page)
})
test("invalid and protected notice/concern URLs reveal no private metadata", async ({
  page,
  request,
}) => {
  for (const [key, id, title] of [
    ["item", "n-private-client", "Notification unavailable"],
    ["item", "n-private-employee", "Notification unavailable"],
    ["item", "n4", "Notification unavailable"],
    ["item", "unknown", "Notification unavailable"],
    ["concernId", "concern-other", "Concern unavailable"],
    ["concernId", "concern-restricted", "Concern unavailable"],
    ["concernId", "unknown", "Concern unavailable"],
  ]) {
    const path = `/notifications?${
      key === "concernId" ? "tab=concerns&" : ""
    }${key}=${id}`
    const response = await request.get(path)
    expect(response.status()).toBe(200)
    const html = await response.text()
    for (const marker of [
      "PRIVATE_CLIENT_NOTICE",
      "PRIVATE_EMPLOYEE_NOTICE",
      "PRIVATE_COWORKER_CONCERN",
      "INTERNAL_MANAGEMENT_CONCERN_NOTE",
    ])
      expect(html).not.toContain(marker)
    await page.goto(path)
    await expect(page.getByRole("dialog")).toContainText(title)
  }
  for (const query of [
    "context=client&targetId=c4&action=new",
    "context=house&targetId=h3&action=new",
    "tab=invalid",
    "item=n1&item=n2",
    "item=n1&action=new",
    "context=client",
    "concernId=concern-other",
  ]) {
    expect((await request.get(`/notifications?${query}`)).status()).toBe(404)
  }
})
test("all read empty view, main navigation and Back remain responsive", async ({
  page,
}) => {
  await page.goto("/notifications?item=n1")
  await page.getByRole("button", { name: "Close", exact: true }).click()
  await page
    .locator(".cm-official-notice")
    .filter({ hasText: "Updated support information" })
    .click()
  await page.getByRole("button", { name: "Close", exact: true }).click()
  await expect(page.locator("[data-unread-count]")).toContainText("0 unread")
  await page
    .getByLabel("Notification read filter", { exact: true })
    .selectOption("unread")
  await expect(
    page.getByText("No unread notifications", { exact: true }),
  ).toBeVisible()
  if (page.viewportSize()!.width < 1024) {
    await page.getByRole("button", { name: "Menu", exact: true }).click()
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Notifications", exact: true })
      .click()
  } else {
    await page
      .locator(".cm-sidebar-nav")
      .getByRole("button", { name: "Notifications", exact: true })
      .click()
  }
  await expect(
    page.getByRole("heading", { name: "Notifications", exact: true }),
  ).toBeVisible()
  await bounds(page)
})
test("long concern text wraps in form, history and details without page overflow", async ({
  page,
}) => {
  await page.goto("/notifications?action=new")
  await submitForm(page)
  const title = "Fictional long title " + "equipment ".repeat(18)
  const description = "Fictional description " + "observation".repeat(80)
  await page.getByLabel("Concern title", { exact: true }).fill(title)
  await page.getByLabel("Description", { exact: true }).fill(description)
  await bounds(page)
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Submit concern", exact: true })
    .click()
  await expect(page).toHaveURL(/tab=concerns&concernId=/)
  await expect(
    page
      .getByRole("dialog")
      .getByRole("heading", { name: title.trim(), exact: true }),
  ).toBeVisible()
  await expect(page.getByRole("dialog")).toContainText(description)
  await bounds(page)
  await page.getByRole("button", { name: "Close", exact: true }).click()
  await expect(page.locator(".cm-concern-item").first()).toContainText(
    title.trim(),
  )
  await bounds(page)
})
test("capture Notifications and Concerns source comparisons across required widths", async ({
  page,
}, info) => {
  test.setTimeout(120000)
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  await mkdir("test-results/phase-1d3", { recursive: true })
  const capture = async (name: string, focus?: string) => {
    await page.evaluate(() => document.fonts.ready)
    if (focus)
      await page
        .locator(focus)
        .first()
        .evaluate((el) => el.scrollIntoView({ block: "start" }))
    await page.evaluate(() => {
      document.scrollingElement?.scrollTo(0, 0)
      document.querySelector(".cm-app")?.scrollTo(0, 0)
    })
    if (name.startsWith("migrated")) await bounds(page)
    await page.screenshot({
      animations: "disabled",
      style: "nextjs-portal{display:none!important}",
      path: `test-results/phase-1d3/${info.project.name}-${name}.png`,
    })
  }
  for (const tab of ["all", "client", "house", "staff"]) {
    await page.goto(`/notifications?tab=${tab}`)
    await expect(page.locator(".cm-official-notice")).toHaveCount(
      tab === "all" ? 3 : 1,
    )
    await capture(`migrated-${tab}`)
  }
  await page.goto("/notifications?item=n1")
  await expect(page.getByRole("dialog")).toBeVisible()
  await capture("migrated-details")
  await page.getByRole("button", { name: "Close", exact: true }).click()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await expect(page.locator(".cm-official-notice").first()).toContainText(
    "Read",
  )
  await capture("migrated-read")
  await page.goto("/notifications?action=new")
  await expect(page.getByRole("dialog")).toBeVisible()
  await capture("migrated-new")
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Submit concern", exact: true })
    .click()
  await capture("migrated-validation")
  await page.getByRole("button", { name: "Cancel", exact: true }).click()
  await page.goto("/notifications?tab=concerns")
  await expect(page.locator(".cm-concern-item")).toHaveCount(4)
  await capture("migrated-history")
  await page.goto("/notifications?tab=concerns&concernId=concern-review")
  await expect(page.getByRole("dialog")).toBeVisible()
  await capture("migrated-concern-details")
  await page.goto("/clients/c1")
  await capture(
    "migrated-client-context",
    '[aria-label="client official notices"]',
  )
  await page.goto("/houses/h1?tab=concerns")
  await capture(
    "migrated-house-context",
    '[aria-label="house official notices"]',
  )
  if (hasUiReference) {
    const original = async () => {
      await page.goto("http://localhost:8557")
      if (page.viewportSize()!.width < 1024)
        await page.getByRole("button", { name: "Menu", exact: true }).click()
      await page
        .locator(".cm-sidebar-nav,.cm-drawer")
        .getByRole("button", { name: /^Notifications/ })
        .filter({ visible: true })
        .click()
    }
    await original()
    for (const tab of ["all", "client", "house", "staff"]) {
      await page
        .getByRole("tab", {
          name:
            tab === "all"
              ? /^All/
              : new RegExp(`^${tab[0].toUpperCase() + tab.slice(1)}$`),
        })
        .click()
      await capture(`original-${tab}`)
    }
    await page.getByRole("tab", { name: /^All/ }).click()
    await page
      .locator(".cm-notice-item")
      .filter({ hasText: "Riverside team handover" })
      .click()
    await capture("original-details")
    await page.keyboard.press("Escape")
    await capture("original-read")
    await page
      .getByRole("button", { name: "Submit concern", exact: true })
      .click()
    await capture("original-new")
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Submit concern", exact: true })
      .click()
    await capture("original-validation")
    await page.getByRole("button", { name: "Cancel", exact: true }).click()
    await page.getByRole("tab", { name: /My concerns/ }).click()
    await capture("original-history")
    await capture(
      "original-concern-details",
      '.cm-notice-item:has-text("appointment transport")',
    )
    // Source has no concern detail screen: its read-only history card is the nearest reference.
    await page.goto("http://localhost:8557")
    await page.locator(".cm-shift-hero").waitFor()
    await page
      .getByRole("button", { name: "Continue to dashboard", exact: true })
      .filter({ visible: true })
      .click()
    await page
      .locator(".cm-client-card")
      .filter({ hasText: "Taylor Reed" })
      .first()
      .click()
    await capture(
      "original-client-context",
      '.cm-panel:has-text("Concerns & notices")',
    )
    await page
      .getByRole("button", { name: "Riverside Lodge", exact: true })
      .filter({ visible: true })
      .first()
      .click()
    await page.getByRole("tab", { name: "Concerns", exact: true }).click()
    await capture("original-house-context", ".cm-stack:has(>h3)")
  }
  expect(errors).toEqual([])
})
