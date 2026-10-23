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
async function navigate(page: Page, label: string, path: string) {
  const bottom: Record<string, string> = {
    Home: "Home",
    Houses: "Houses",
    Search: "Search",
    "Roster & Timesheets": "Roster",
  }
  if (page.viewportSize()!.width < 1024) {
    if (bottom[label])
      await page
        .locator(".cm-bottom-nav")
        .getByRole("button", { name: bottom[label], exact: true })
        .click()
    else {
      await page.getByRole("button", { name: "Menu", exact: true }).click()
      await page
        .getByRole("dialog", { name: "Menu", exact: true })
        .getByRole("button", {
          name: new RegExp(
            `^${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\s|$)`,
          ),
        })
        .click()
    }
  } else
    await page
      .locator(".cm-sidebar-nav")
      .getByRole("button", {
        name: new RegExp(
          `^${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\s|$)`,
        ),
      })
      .click()
  await expect(page).toHaveURL(new RegExp(`${path.replace("?", "\\?")}$`))
}
async function originalNav(page: Page, label: string) {
  if (page.viewportSize()!.width < 1024)
    await page.getByRole("button", { name: "Menu", exact: true }).click()
  await page
    .locator(".cm-sidebar-nav,.cm-drawer")
    .getByRole("button", { name: label, exact: true })
    .filter({ visible: true })
    .click()
}
test("profile identity, management fields and assigned houses use current shared records", async ({
  page,
}) => {
  await page.goto("/dashboard")
  await page.locator(".cm-me-card").click()
  await expect(page).toHaveURL(/\/profile$/)
  await expect(
    page.getByRole("heading", { name: "My profile", exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole("region", { name: "Current employee" }),
  ).toContainText("Jamie Taufa")
  const employee = page.locator(".cm-panel").filter({
    has: page.getByRole("heading", {
      name: "Employee information",
      exact: true,
    }),
  })
  for (const text of [
    "EMP-001",
    "Support Worker",
    "jamie@example.invalid",
    "Active · fictional account fixture",
  ])
    await expect(employee).toContainText(text)
  await expect(page.getByText("PRIVATE_COWORKER_PROFILE_ADDRESS")).toHaveCount(
    0,
  )
  await page
    .getByRole("button", { name: "Open Sunrise House", exact: true })
    .click()
  await expect(page).toHaveURL(/\/houses\/h2$/)
  await page.goBack()
  await expect(page).toHaveURL(/\/profile$/)
  await page.reload()
  await expect(page.getByText("000 000 0010", { exact: true })).toBeVisible()
  await bounds(page)
})
test("profile allowlist validates and updates own session values without editable account controls", async ({
  page,
}) => {
  await page.goto("/profile?action=edit")
  const form = page.getByRole("form", { name: "Edit contact details" })
  await expect(form.locator("input")).toHaveCount(3)
  for (const field of [
    "Role",
    "Account status",
    "Work email",
    "Employee ID",
    "Preferred name",
  ])
    await expect(page.getByLabel(field, { exact: true })).toHaveCount(0)
  await page.getByLabel("Mobile phone", { exact: true }).fill("invalid")
  await page.getByRole("button", { name: "Save changes", exact: true }).click()
  await expect(form.getByRole("alert")).toContainText("7–15 digits")
  await page.getByLabel("Mobile phone", { exact: true }).fill("000 000 0099")
  await page
    .getByLabel("Home address", { exact: true })
    .fill("Fictional updated address")
  await page
    .getByLabel("Emergency contact", { exact: true })
    .fill("Fictional updated contact")
  await page.getByRole("button", { name: "Save changes", exact: true }).click()
  await expect(page).toHaveURL(/\/profile$/)
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "No employee account was updated" }),
  ).toBeVisible()
  await expect(
    page.getByText("Fictional updated address", { exact: true }),
  ).toBeVisible()
  await navigate(page, "Leave", "/leave")
  await page.getByRole("button", { name: "Request leave", exact: true }).click()
  await expect(page.getByLabel("Employee", { exact: true })).toHaveValue(
    "Jamie Taufa",
  )
  await page.getByRole("button", { name: "Cancel", exact: true }).click()
  await navigate(page, "My Profile", "/profile")
  await expect(page.getByText("000 000 0099", { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByText("000 000 0010", { exact: true })).toBeVisible()
  await bounds(page)
})
test("unsaved inline contact edits protect Cancel, navigation and Back and preserve keyboard focus", async ({
  page,
}) => {
  await page.goto("/profile")
  await page.getByRole("button", { name: "Edit profile", exact: true }).click()
  await expect(page).toHaveURL(/action=edit/)
  const phone = page.getByLabel("Mobile phone", { exact: true })
  await expect(phone).toBeFocused()
  await phone.fill("000 000 0088")
  await page
    .getByLabel("Home address", { exact: true })
    .pressSequentially(" more fictional text")
  await expect(page.getByLabel("Home address", { exact: true })).toBeFocused()
  page.once("dialog", (d) => d.dismiss())
  await page.getByRole("button", { name: "Cancel", exact: true }).click()
  await expect(phone).toHaveValue("000 000 0088")
  page.once("dialog", (d) => d.dismiss())
  await page
    .getByRole("navigation", { name: "Breadcrumb" })
    .getByRole("button", { name: "Dashboard", exact: true })
    .click()
  await expect(page).toHaveURL(/action=edit/)
  page.once("dialog", (d) => d.dismiss())
  await page.goBack()
  await expect(phone).toHaveValue("000 000 0088")
  page.once("dialog", (d) => d.accept())
  await page.getByRole("button", { name: "Cancel", exact: true }).click()
  await expect(page).toHaveURL(/\/profile$/)
  await expect(page.getByText("000 000 0010", { exact: true })).toBeVisible()
  await bounds(page)
})
test("staff photo reuses validation, shares temporary display and revokes owned URLs", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const state = { created: [] as string[], revoked: [] as string[] }
    Object.assign(window, { profileUrls: state })
    const create = URL.createObjectURL.bind(URL),
      revoke = URL.revokeObjectURL.bind(URL)
    URL.createObjectURL = (blob) => {
      const url = create(blob)
      state.created.push(url)
      return url
    }
    URL.revokeObjectURL = (url) => {
      state.revoked.push(url)
      revoke(url)
    }
  })
  await page.goto("/profile?action=photo")
  const picker = page.getByRole("dialog")
  await page
    .getByLabel("Select profile demonstration photo", { exact: true })
    .setInputFiles({
      name: "unsupported.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from("example"),
    })
  await expect(picker.getByRole("alert")).toContainText("Unsupported file type")
  await expect(
    page.getByRole("button", { name: "Use temporary photo", exact: true }),
  ).toBeDisabled()
  await page
    .getByLabel("Select profile demonstration photo", { exact: true })
    .setInputFiles("public/demo-assets/garden-demo.png")
  await expect(picker).toContainText("No file or record is uploaded")
  await page
    .getByRole("button", { name: "Cancel photo selection", exact: true })
    .click()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await expect(page.locator(".cm-profile-head img")).toHaveCount(0)
  await page
    .getByRole("button", { name: "Change profile photo", exact: true })
    .click()
  await page
    .getByLabel("Select profile demonstration photo", { exact: true })
    .setInputFiles("public/demo-assets/garden-demo.png")
  await page
    .getByRole("button", { name: "Use temporary photo", exact: true })
    .click()
  await expect(page).toHaveURL(/\/profile$/)
  const image = page.locator(".cm-profile-head img")
  await expect(image).toHaveAttribute("src", /^blob:/)
  const applied = await image.getAttribute("src")
  await navigate(page, "Home", "/dashboard")
  await expect(page.locator(".cm-me-card img")).toHaveAttribute("src", applied!)
  await expect(page.locator(".cm-sidebar-user img")).toHaveAttribute(
    "src",
    applied!,
  )
  if (page.viewportSize()!.width < 1024) {
    await page.getByRole("button", { name: "Menu", exact: true }).click()
    await expect(page.locator(".cm-drawer-user img")).toHaveAttribute(
      "src",
      applied!,
    )
    await page.keyboard.press("Escape")
  }
  await navigate(page, "My Profile", "/profile")
  await page
    .getByRole("button", { name: "Change profile photo", exact: true })
    .click()
  await page
    .getByLabel("Select profile demonstration photo", { exact: true })
    .setInputFiles("public/demo-assets/room-demo.png")
  await page
    .getByRole("button", { name: "Use temporary photo", exact: true })
    .click()
  await expect(page).toHaveURL(/\/profile$/)
  await expect
    .poll(() =>
      page.evaluate(
        (url) =>
          (window as unknown as {
            profileUrls: { revoked: string[] }
          }).profileUrls.revoked.includes(url!),
        applied,
      ),
    )
    .toBe(true)
  const latest = await page.locator(".cm-profile-head img").getAttribute("src")
  if (page.viewportSize()!.width < 1024) {
    await page.getByRole("button", { name: "Menu", exact: true }).click()
    await page
      .getByRole("dialog", { name: "Menu", exact: true })
      .getByRole("button", { name: "Sign out", exact: true })
      .click()
  } else
    await page.getByRole("button", { name: "Sign out", exact: true }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect
    .poll(() =>
      page.evaluate(
        (url) =>
          (window as unknown as {
            profileUrls: { revoked: string[] }
          }).profileUrls.revoked.includes(url!),
        latest,
      ),
    )
    .toBe(true)
  await page.goto("/profile")
  await expect(page.locator(".cm-profile-head img")).toHaveCount(0)
  await page.reload()
  await expect(page.locator(".cm-profile-head img")).toHaveCount(0)
  await bounds(page)
})
test("settings is Coming Soon and security actions cannot claim real account changes", async ({
  page,
}) => {
  await page.goto("/profile")
  await expect(
    page.getByText(
      /Authentication, password reset and two-factor security are not connected/,
    ),
  ).toBeVisible()
  await expect(
    page.getByRole("button", {
      name: /Change password|Enable 2FA|Reset password|Change role/,
    }),
  ).toHaveCount(0)
  await navigate(page, "Settings", "/settings")
  await expect(
    page.getByText("Settings — Coming soon", { exact: true }),
  ).toBeVisible()
  await expect(page.getByRole("textbox")).toHaveCount(0)
  await expect(page.getByRole("checkbox")).toHaveCount(0)
  await expect(page.locator(".ad-app")).toHaveCount(0)
  await page
    .getByRole("button", { name: "Back to Dashboard", exact: true })
    .click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await bounds(page)
})
test("all nine primary destinations work with active desktop or mobile menu navigation", async ({
  page,
}) => {
  await page.goto("/dashboard")
  for (const [label, path] of [
    ["Home", "/dashboard"],
    ["Clock-in / My Shifts", "/shift-check"],
    ["Houses", "/houses"],
    ["Search", "/search"],
    ["Roster & Timesheets", "/roster"],
    ["Leave", "/leave"],
    ["Notifications", "/notifications"],
    ["My Profile", "/profile"],
    ["Settings", "/settings"],
  ]) {
    await navigate(page, label, path)
    if (page.viewportSize()!.width >= 1024)
      await expect(
        page.locator(".cm-sidebar-nav [aria-current=page]"),
      ).toHaveCount(1)
    else if (
      [
        "Leave",
        "Notifications",
        "My Profile",
        "Settings",
        "Clock-in / My Shifts",
      ].includes(label)
    ) {
      await page.getByRole("button", { name: "Menu", exact: true }).click()
      await expect(
        page.locator(".cm-drawer-item[aria-current=page]"),
      ).toHaveCount(1)
      await page.keyboard.press("Escape")
      await expect(
        page.getByRole("button", { name: "Menu", exact: true }),
      ).toBeFocused()
    }
    await bounds(page)
  }
})
test("invalid employee, client and house routes cannot retrieve another profile or protected record", async ({
  page,
  request,
}) => {
  for (const path of [
    "/profile/s2",
    "/profile?employeeId=s2",
    "/profile?id=s4",
    "/profile?action=role",
    "/profile?action=edit&action=photo",
    "/clients/c4",
    "/houses/h3",
  ]) {
    const response = await request.get(path)
    expect(response.status()).toBe(404)
    const html = await response.text()
    expect(html).not.toContain("PRIVATE_COWORKER_PROFILE_ADDRESS")
    expect(html).not.toContain("PRIVATE_COWORKER_EMERGENCY_CONTACT")
  }
  await page.goto("/profile?action=edit")
  await page.reload()
  await expect(
    page.getByRole("form", { name: "Edit contact details" }),
  ).toBeVisible()
  await bounds(page)
})
test("core Staff journey preserves house client employee and record context across modules", async ({
  page,
}) => {
  test.setTimeout(120000)
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  await page.goto("/login")
  await page.getByLabel("Email address").fill("fictional@example.invalid")
  await page.getByLabel("Password", { exact: true }).fill("fictional-input")
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  await expect(page).toHaveURL(/\/shift-check$/)
  await expect(page.getByTestId("shift-row")).toHaveCount(3)
  await expect(
    page.getByRole("button", { name: "Clock in unavailable", exact: true }),
  ).toBeDisabled()
  await page
    .getByRole("button", { name: "Continue to dashboard", exact: true })
    .filter({ visible: true })
    .first()
    .click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await page
    .locator(".cm-house-mini")
    .filter({ hasText: "Riverside Lodge" })
    .click()
  await expect(page).toHaveURL(/\/houses\/h1$/)
  await page
    .locator(".cm-client-card")
    .filter({ hasText: "Taylor Reed" })
    .click()
  await expect(page).toHaveURL(/\/clients\/c1$/)
  await expect(
    page.getByRole("heading", { name: "Contacts & next of kin", exact: true }),
  ).toBeVisible()
  await page.getByRole("tab", { name: "Diary", exact: true }).click()
  await page.getByRole("link", { name: "New entry", exact: true }).click()
  await page
    .getByLabel("Entry title", { exact: true })
    .fill("Fictional integration diary")
  await page.getByLabel("Category", { exact: true }).selectOption("cat1")
  await page
    .getByLabel("Diary entry", { exact: true })
    .fill("Fictional integration observation only.")
  await page
    .getByLabel("Date and time covered", { exact: true })
    .fill("2026-10-22T12:00")
  await page
    .getByLabel("Reason for off-shift documentation")
    .fill("Fictional after-handover documentation")
  await page.getByRole("button", { name: "Submit entry", exact: true }).click()
  await expect(page).toHaveURL(/tab=diary$/)
  await expect(page.locator(".cm-history").first()).toContainText(
    "Fictional integration diary",
  )
  await expect(page.locator(".cm-history").first()).toContainText("Jamie Taufa")
  await page.getByRole("tab", { name: /Care Plan/ }).click()
  await page
    .locator(".cm-category")
    .filter({ hasText: "Skin Integrity" })
    .getByRole("link", { name: /Add entry/ })
    .click()
  await expect(page).toHaveURL(/records\/new\?templateId=t1/)
  await expect(
    page.getByRole("heading", { name: /Skin Integrity/ }),
  ).toBeVisible()
  await page.getByRole("button", { name: "Cancel", exact: true }).click()
  await page.getByRole("tab", { name: /Charting/ }).click()
  await page
    .locator(".cm-category")
    .filter({ hasText: "Bowel Movement Chart" })
    .getByRole("link", { name: /Add entry/ })
    .click()
  await expect(page).toHaveURL(/templateId=t4/)
  await page.getByRole("button", { name: "Cancel", exact: true }).click()
  await page.getByRole("tab", { name: "Gallery", exact: true }).click()
  await expect(page.locator("[data-file-id]")).toHaveCount(6)
  await page
    .getByRole("navigation", { name: "Breadcrumb", exact: true })
    .getByRole("button", { name: "Riverside Lodge", exact: true })
    .click()
  await expect(page).toHaveURL(/\/houses\/h1$/)
  await page.getByRole("tab", { name: "House diary", exact: true }).click()
  await expect(
    page.getByRole("link", { name: "New entry", exact: true }),
  ).toHaveAttribute("href", "/houses/h1/diary/new")
  await page.getByRole("tab", { name: "Documents", exact: true }).click()
  await expect(page.locator("[data-file-id]")).toHaveCount(5)
  await navigate(page, "Roster & Timesheets", "/roster")
  await page
    .getByTestId("shift-row")
    .filter({ hasText: "Riverside Lodge" })
    .first()
    .click()
  await expect(page.getByRole("dialog")).toContainText("Riverside Lodge")
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await page.getByRole("tab", { name: "My timesheets", exact: true }).click()
  await page
    .locator('[data-timesheet-shift="overnight"]')
    .getByRole("link", { name: /View details/ })
    .click()
  await expect(page.getByRole("dialog")).toContainText(
    "Fictional development attendance",
  )
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await navigate(page, "Leave", "/leave")
  await page.getByRole("button", { name: "Request leave", exact: true }).click()
  await page.getByLabel("Start date", { exact: true }).fill("2026-11-01")
  await page.getByLabel("End date", { exact: true }).fill("2026-11-02")
  await page
    .getByRole("button", { name: "Submit request", exact: true })
    .click()
  await expect(page).toHaveURL(/requestId=/)
  await expect(page.getByRole("dialog")).toContainText("Pending Review")
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await navigate(page, "Notifications", "/notifications")
  await page.locator(".cm-official-notice").first().click()
  await expect(page.getByRole("dialog")).toContainText(
    "Read · your development session",
  )
  await page
    .getByRole("button", { name: "Open House Profile", exact: true })
    .click()
  await expect(page).toHaveURL(/\/houses\/h1$/)
  await page
    .locator(".cm-client-card")
    .filter({ hasText: "Taylor Reed" })
    .click()
  await page
    .getByRole("button", { name: "Submit concern", exact: true })
    .click()
  await expect(
    page.getByLabel("Related client or house", { exact: true }),
  ).toHaveValue("c1")
  await page.getByRole("button", { name: "Cancel", exact: true }).click()
  await navigate(page, "My Profile", "/profile")
  await page.getByRole("button", { name: "Edit profile", exact: true }).click()
  await page.getByLabel("Mobile phone", { exact: true }).fill("000 000 0077")
  await page.getByRole("button", { name: "Save changes", exact: true }).click()
  await expect(page).toHaveURL(/\/profile$/)
  await expect(page.getByText("000 000 0077", { exact: true })).toBeVisible()
  await navigate(page, "Settings", "/settings")
  await expect(
    page.getByText("Settings — Coming soon", { exact: true }),
  ).toBeVisible()
  await bounds(page)
  expect(errors).toEqual([])
})
test("long read-only employee names wrap without changing managed identity", async ({
  page,
}) => {
  await page.goto("/profile")
  await page
    .locator(".cm-staff-name")
    .evaluate(
      (el) =>
        (el.textContent =
          "Fictional long employee name " + "Longname".repeat(30)),
    )
  await page
    .locator(".cm-sidebar-user strong")
    .evaluate((el) => (el.textContent = "Fictional " + "Longname".repeat(30)))
  if (page.viewportSize()!.width < 1024) {
    await page.getByRole("button", { name: "Menu", exact: true }).click()
    await page
      .locator(".cm-drawer-user strong")
      .evaluate((el) => (el.textContent = "Fictional " + "Longname".repeat(30)))
    await bounds(page)
    await page.keyboard.press("Escape")
  }
  await bounds(page)
  await expect(page.getByText("EMP-001", { exact: true })).toBeVisible()
  await expect(page.locator("input")).toHaveCount(0)
})
test("capture final Profile Settings and Staff integration source comparisons", async ({
  page,
}, info) => {
  test.setTimeout(120000)
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  await mkdir("test-results/phase-1d4", { recursive: true })
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
      path: `test-results/phase-1d4/${info.project.name}-${name}.png`,
    })
  }
  await page.goto("/profile")
  await expect(
    page.getByRole("heading", { name: "My profile", exact: true }),
  ).toBeVisible()
  await capture("migrated-overview")
  await capture(
    "migrated-houses",
    '.cm-panel:has-text("Assigned houses"):not(:has-text("Employee information"))',
  )
  await capture("migrated-locked", '.cm-panel:has-text("Employee information")')
  await page.getByRole("button", { name: "Edit profile", exact: true }).click()
  await expect(
    page.getByRole("form", { name: "Edit contact details" }),
  ).toBeVisible()
  await capture("migrated-edit", '[aria-label="Edit contact details"]')
  await page.getByLabel("Mobile phone", { exact: true }).fill("invalid")
  await page.getByRole("button", { name: "Save changes", exact: true }).click()
  await expect(page.getByRole("form").getByRole("alert")).toBeVisible()
  await capture("migrated-validation", '[aria-label="Edit contact details"]')
  page.once("dialog", (d) => d.accept())
  await page.getByRole("button", { name: "Cancel", exact: true }).click()
  await expect(page).toHaveURL(/\/profile$/)
  await page
    .getByRole("button", { name: "Change profile photo", exact: true })
    .click()
  await page
    .getByLabel("Select profile demonstration photo", { exact: true })
    .setInputFiles("public/demo-assets/garden-demo.png")
  await expect(page.getByRole("dialog").locator("img")).toBeVisible()
  await capture("migrated-photo")
  await page
    .getByRole("button", { name: "Cancel photo selection", exact: true })
    .click()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  if (page.viewportSize()!.width < 1024)
    await page.getByRole("button", { name: "Menu", exact: true }).click()
  await capture("migrated-navigation")
  if (page.viewportSize()!.width < 1024) await page.keyboard.press("Escape")
  await navigate(page, "Settings", "/settings")
  await capture("migrated-settings")
  await page
    .getByRole("button", { name: "Back to Dashboard", exact: true })
    .click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await capture("migrated-integration")
  if (hasUiReference) {
    await page.goto("http://localhost:8557")
    await originalNav(page, "My Profile")
    await capture("original-overview")
    await capture(
      "original-houses",
      '.cm-panel:has-text("Employee information")',
    )
    await capture(
      "original-locked",
      '.cm-panel:has-text("Employee information")',
    )
    await page.getByRole("button", { name: "Edit", exact: true }).click()
    await capture("original-edit", '.cm-panel:has-text("Contact details")')
    await page.locator("#p-phone").fill("invalid")
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click()
    await capture(
      "original-validation",
      '.cm-panel:has-text("Contact details")',
    )
    await page.getByRole("button", { name: "Cancel", exact: true }).click()
    await page
      .locator('.cm-photo-edit input[type="file"]')
      .setInputFiles("public/demo-assets/garden-demo.png")
    await expect(page.locator(".cm-profile-head img")).toBeVisible()
    await expect
      .poll(() =>
        page
          .locator(".cm-profile-head img")
          .evaluate(
            (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
          ),
      )
      .toBe(true)
    await capture("original-photo", ".cm-profile-head")
    await page
      .getByText("Profile photo updated", { exact: true })
      .waitFor({ state: "hidden" })
    if (page.viewportSize()!.width < 1024)
      await page.getByRole("button", { name: "Menu", exact: true }).click()
    await capture("original-navigation")
    if (page.viewportSize()!.width < 1024)
      await page
        .getByRole("button", { name: "Close menu", exact: true })
        .click()
    await originalNav(page, "Settings")
    await capture("original-settings")
    if (page.viewportSize()!.width < 1024)
      await page
        .locator(".cm-bottom-nav")
        .getByRole("button", { name: "Home", exact: true })
        .click()
    else
      await page
        .locator(".cm-sidebar-nav")
        .getByRole("button", { name: "Home", exact: true })
        .click()
    await page.goto("http://localhost:8557")
    await page
      .getByRole("button", { name: "Continue to dashboard", exact: true })
      .filter({ visible: true })
      .first()
      .click()
    await capture("original-integration")
  }
  expect(errors).toEqual([])
})
