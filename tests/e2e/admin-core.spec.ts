import { test, expect, type Page } from "@playwright/test"
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
async function enter(page: Page) {
  await page.goto("/login")
  await page
    .getByRole("button", { name: "Preview administration", exact: true })
    .click()
  await expect(
    page.getByRole("heading", { name: "Kia ora, Example", exact: true }),
  ).toBeVisible()
}
async function nav(page: Page, label: string) {
  await page
    .locator(".ad-nav")
    .getByRole("link", { name: new RegExp(`^${label}(?:\\s|$)`) })
    .click()
}
async function employee(page: Page, name = "Jamie Taufa") {
  await nav(page, "Employees")
  await page
    .getByRole("row")
    .filter({ hasText: name })
    .getByRole("button", { name: "View details", exact: true })
    .click()
  await expect(page.getByRole("heading", { level: 1 })).toContainText(name)
}
async function house(page: Page, name = "Riverside Lodge") {
  await nav(page, "Houses")
  await page.getByRole("button", { name: new RegExp(name) }).click()
  await expect(page.getByRole("heading", { level: 1 })).toContainText(name)
}
async function client(page: Page, name = "Taylor Reed") {
  await nav(page, "Clients")
  await page
    .getByRole("row")
    .filter({ hasText: name })
    .getByRole("button", { name: "View details", exact: true })
    .click()
  await expect(page.getByRole("heading", { level: 1 })).toContainText(name)
}
async function role(page: Page, value: string) {
  await page.locator(".ad-account").click()
  await page
    .getByLabel("Preview role · no trusted session", { exact: true })
    .selectOption(value)
  await page.keyboard.press("Escape")
}
async function bounds(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true)
}
function desktop(page: Page) {
  test.skip(
    page.viewportSize()!.width < 1024,
    "Admin management is desktop-only; narrow fallback has dedicated coverage.",
  )
}
test("Admin desktop gate and explicit development opt-in preserve Staff mobile", async ({
  page,
}) => {
  await page.goto("/admin/dashboard")
  const narrow = page.viewportSize()!.width < 1024
  await expect(page.locator(".ad-desktop-guard")).toBeVisible({
    visible: narrow,
  })
  await expect(page.locator(".ad-app")).toBeVisible({ visible: !narrow })
  if (narrow)
    await expect(
      page.getByText(
        "CareMetrics Administration is available on desktop browsers. Please open this interface on a larger screen.",
        { exact: true },
      ),
    ).toBeVisible()
  else {
    await expect(
      page.getByText(
        "Staff and Senior Staff cannot use Admin management screens or mutations.",
        { exact: true },
      ),
    ).toBeVisible()
    await expect(
      page.getByRole("heading", { name: "Kia ora, Example" }),
    ).toHaveCount(0)
  }
  await bounds(page)
  await page.goto("/dashboard")
  await expect(page.locator(".cm-app")).toBeVisible()
  await expect(page.locator(".ad-app")).toHaveCount(0)
})
test("Admin shell navigation active state search account menu and future modules", async ({
  page,
}) => {
  desktop(page)
  await enter(page)
  for (const label of [
    "Employees",
    "Houses",
    "Clients",
    "Rosters & Attendance",
    "Leave Management",
    "Care Documentation",
    "Files & Galleries",
    "Notifications & Concerns",
    "Reports & Audit",
    "Settings",
    "Dashboard",
  ]) {
    await nav(page, label)
    await expect(
      page
        .locator(".ad-nav")
        .getByRole("link", { name: new RegExp(`^${label}(?:\\s|$)`) }),
    ).toHaveAttribute("aria-current", "page")
  }
  await page.getByRole("button", { name: "Collapse sidebar" }).click()
  await expect(page.locator(".ad-app")).toHaveClass(/collapsed/)
  await page.getByRole("button", { name: "Expand sidebar" }).click()
  await page.getByLabel("Global search", { exact: true }).fill("Taylor")
  await page
    .getByRole("link", { name: "Taylor Reed clients", exact: true })
    .click()
  await expect(page).toHaveURL(/\/admin\/clients\/c1$/)
  await page.locator(".ad-account").click()
  await expect(
    page.getByText("Development preview only", { exact: true }),
  ).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(page.locator(".ad-account")).toBeFocused()
  await bounds(page)
})
test("employee directory filters pagination and create validation use shared totals", async ({
  page,
}) => {
  desktop(page)
  await enter(page)
  await nav(page, "Employees")
  await page
    .getByPlaceholder("Search name, email or employee ID")
    .fill("jamie@example.invalid")
  await expect(
    page.getByRole("row").filter({ hasText: "Jamie Taufa" }),
  ).toHaveCount(1)
  await expect(
    page.getByRole("row").filter({ hasText: "Alex Morgan" }),
  ).toHaveCount(0)
  await page
    .getByPlaceholder("Search name, email or employee ID")
    .fill("no matching employee")
  await expect(
    page.getByText("No employees match your filters", { exact: true }),
  ).toBeVisible()
  await page.getByRole("button", { name: "Clear filters", exact: true }).click()
  await page
    .getByRole("button", { name: "Create employee", exact: true })
    .click()
  await expect(page.getByLabel("First name", { exact: true })).toBeVisible()
  await page
    .getByRole("button", { name: "Create employee", exact: true })
    .click()
  await expect(page.locator(".ad-entity-form > [role=alert]")).toContainText(
    "first name",
  )
  for (const [label, value] of [
    ["First name", "Fictional"],
    ["Last name", "Worker"],
    ["Employee ID", "EMP-001"],
    ["Work email", "jamie@example.invalid"],
  ])
    await page.getByLabel(label, { exact: true }).fill(value)
  await page
    .getByRole("button", { name: "Create employee", exact: true })
    .click()
  await expect(page.locator(".ad-entity-form > [role=alert]")).toContainText(
    "unique",
  )
  await page.getByLabel("Employee ID", { exact: true }).fill("EMP-BROWSER")
  await page
    .getByLabel("Work email", { exact: true })
    .fill("browser@example.invalid")
  await page
    .getByLabel("Account status", { exact: true })
    .selectOption("Active")
  await page
    .locator(".ad-picker-list label")
    .filter({ hasText: "Riverside Lodge" })
    .getByRole("checkbox")
    .check()
  await page
    .locator(".ad-picker-list label")
    .filter({ hasText: "Sunrise House" })
    .getByRole("checkbox")
    .check()
  await page
    .getByRole("button", { name: "Create employee", exact: true })
    .click()
  await expect(page).toHaveURL(/\/admin\/employees\/[\da-f-]+\?saved=1$/)
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Fictional Worker",
  )
  await page.getByRole("tab", { name: /House assignments/ }).click()
  await expect(page.locator(".ad-house-tile")).toHaveCount(2)
  await nav(page, "Dashboard")
  await expect(
    page
      .locator(".ad-stat")
      .filter({ hasText: "Active employees" })
      .locator("strong"),
  ).toHaveText("7")
})
test("employee edits and temporary photos propagate to Staff Profile and reset on refresh", async ({
  page,
}) => {
  desktop(page)
  await enter(page)
  await employee(page)
  await page.getByRole("button", { name: "Edit employee", exact: true }).click()
  await page.getByLabel("Phone", { exact: true }).fill("000 000 7777")
  await page
    .getByRole("button", { name: "Select demonstration photo", exact: true })
    .click()
  await page
    .getByLabel("Select profile demonstration photo", { exact: true })
    .setInputFiles("public/demo-assets/garden-demo.png")
  await page
    .getByRole("button", { name: "Use temporary photo", exact: true })
    .click()
  await page.getByRole("button", { name: "Save changes", exact: true }).click()
  await expect(page).toHaveURL(/\/admin\/employees\/s1\?saved=1$/)
  await page
    .getByRole("button", { name: "View Staff preview", exact: true })
    .click()
  await expect(page.getByText("000 000 7777", { exact: true })).toBeVisible()
  await expect(page.locator(".cm-profile-head img")).toHaveAttribute(
    "src",
    /^blob:/,
  )
  await page.reload()
  await expect(page.getByText("000 000 0010", { exact: true })).toBeVisible()
  await expect(page.locator(".cm-profile-head img")).toHaveCount(0)
})
test("assignment add and nonconflicting removal change Staff visibility while scheduled dependencies block", async ({
  page,
}) => {
  desktop(page)
  await enter(page)
  await employee(page)
  await page.getByRole("tab", { name: /House assignments/ }).click()
  await page
    .getByRole("button", { name: "Manage assignments", exact: true })
    .click()
  const dialog = page.getByRole("dialog")
  await dialog
    .locator(".ad-picker-list label")
    .filter({ hasText: "Sunrise House" })
    .getByRole("checkbox")
    .uncheck()
  await expect(dialog).toContainText("This employee has scheduled shifts")
  await expect(
    dialog.getByRole("button", { name: "Save changes", exact: true }),
  ).toBeDisabled()
  await dialog
    .locator(".ad-picker-list label")
    .filter({ hasText: "Sunrise House" })
    .getByRole("checkbox")
    .check()
  await dialog
    .locator(".ad-picker-list label")
    .filter({ hasText: "Cedar Hill" })
    .getByRole("checkbox")
    .check()
  await dialog
    .getByRole("button", { name: "Save changes", exact: true })
    .click()
  await page
    .getByRole("button", { name: "View Staff preview", exact: true })
    .click()
  await expect(
    page.getByRole("button", { name: "Open Cedar Hill", exact: true }),
  ).toBeVisible()
  await page
    .getByRole("button", { name: "Open Cedar Hill", exact: true })
    .click()
  await expect(page).toHaveURL(/\/houses\/h3$/)
  await expect(
    page.getByRole("heading", { name: "Cedar Hill", exact: true }),
  ).toBeVisible()
  await page.goBack()
  await page.goBack()
  await expect(page).toHaveURL(/\/admin\/employees\/s1\?tab=houses$/)
  await page
    .getByRole("button", { name: "Manage assignments", exact: true })
    .click()
  await page
    .getByRole("dialog")
    .locator(".ad-picker-list label")
    .filter({ hasText: "Cedar Hill" })
    .getByRole("checkbox")
    .uncheck()
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save changes", exact: true })
    .click()
  await page
    .getByRole("button", { name: "View Staff preview", exact: true })
    .click()
  await expect(
    page.getByRole("button", { name: "Open Cedar Hill", exact: true }),
  ).toHaveCount(0)
})
test("deactivation keeps employee history and reactivation restores current Staff context", async ({
  page,
}) => {
  desktop(page)
  await enter(page)
  await employee(page)
  await page
    .getByRole("tab", { name: "Account & permissions", exact: true })
    .click()
  await expect(
    page.getByRole("button", { name: "Unavailable", exact: true }),
  ).toBeDisabled()
  await page.getByRole("button", { name: "Deactivate", exact: true }).click()
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm status change", exact: true })
    .click()
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Inactive",
  )
  await page.getByRole("tab", { name: /House assignments/ }).click()
  await expect(page.locator(".ad-house-tile")).toHaveCount(2)
  await page
    .getByRole("tab", { name: "Account & permissions", exact: true })
    .click()
  await page.getByRole("button", { name: "Reactivate", exact: true }).click()
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm status change", exact: true })
    .click()
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Active")
})
test("house create edit location validation and Staff Dashboard Houses Search propagation", async ({
  page,
}) => {
  desktop(page)
  await enter(page)
  await nav(page, "Houses")
  await page.getByRole("button", { name: "Create house", exact: true }).click()
  await page.getByRole("button", { name: "Save house", exact: true }).click()
  await expect(page.locator(".ad-entity-form > [role=alert]")).toContainText(
    "unique house code",
  )
  for (const [label, value] of [
    ["House name", "Fictional New House"],
    ["House code", "HOUSE-BROWSER"],
    ["Street address", "Fictional Hamilton address"],
    ["Contact phone", "000 000 4321"],
  ])
    await page.getByLabel(label, { exact: true }).fill(value)
  await page.getByLabel("Latitude", { exact: true }).fill("NaN")
  await page.getByRole("button", { name: "Save house", exact: true }).click()
  await expect(page.locator(".ad-entity-form > [role=alert]")).toContainText(
    "latitude",
  )
  await page.getByLabel("Latitude", { exact: true }).fill("")
  await page.getByRole("button", { name: "Save house", exact: true }).click()
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Fictional New House",
  )
  await house(page)
  await page.getByRole("button", { name: "Edit house", exact: true }).click()
  await page.getByLabel("House name", { exact: true }).fill("Riverside Updated")
  await page
    .getByLabel("Street address", { exact: true })
    .fill("Updated fictional address")
  await page.getByRole("button", { name: "Save house", exact: true }).click()
  await employee(page)
  await page
    .getByRole("button", { name: "View Staff preview", exact: true })
    .click()
  await page
    .locator(".cm-sidebar-nav")
    .getByRole("button", { name: "Home", exact: true })
    .click()
  await expect(
    page.locator(".cm-house-mini").filter({ hasText: "Riverside Updated" }),
  ).toBeVisible()
  await page
    .locator(".cm-sidebar-nav")
    .getByRole("button", { name: "Houses", exact: true })
    .click()
  await expect(
    page.locator(".cm-house-card").filter({ hasText: "Riverside Updated" }),
  ).toContainText("Updated fictional address")
  await page
    .locator(".cm-sidebar-nav")
    .getByRole("button", { name: "Search", exact: true })
    .click()
  await page
    .getByPlaceholder("Search by client or house name")
    .fill("Riverside Updated")
  await expect(
    page.getByText("Riverside Updated", { exact: true }).first(),
  ).toBeVisible()
})
test("client creation validates one house and stable contacts then appears for assigned Staff", async ({
  page,
}) => {
  desktop(page)
  await enter(page)
  await nav(page, "Clients")
  await page.getByRole("button", { name: "Create client", exact: true }).click()
  await page.getByRole("button", { name: "Save client", exact: true }).click()
  await expect(page.locator(".ad-entity-form > [role=alert]")).toContainText(
    "active house",
  )
  for (const [label, value] of [
    ["First name", "Fictional"],
    ["Last name", "New Client"],
    ["Client reference", "CLIENT-BROWSER"],
  ])
    await page.getByLabel(label, { exact: true }).fill(value)
  await page.getByLabel("Current house", { exact: true }).selectOption("h1")
  await page.getByRole("button", { name: "Save client", exact: true }).click()
  await expect(page).toHaveURL(/\/admin\/clients\/[\da-f-]+\?saved=1$/)
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Fictional New Client",
  )
  await employee(page)
  await page
    .getByRole("button", { name: "View Staff preview", exact: true })
    .click()
  await page
    .locator(".cm-sidebar-nav")
    .getByRole("button", { name: "Houses", exact: true })
    .click()
  await page
    .locator(".cm-house-card")
    .filter({ hasText: "Riverside Lodge" })
    .click()
  await page
    .locator(".cm-client-card")
    .filter({ hasText: "Fictional New Client" })
    .click()
  await expect(
    page.getByRole("heading", { name: "Fictional New Client", exact: true }),
  ).toBeVisible()
})
test("NOK editor enforces primary consistency removal confirmation and Staff contact propagation", async ({
  page,
}) => {
  desktop(page)
  await enter(page)
  await client(page)
  await page.getByRole("tab", { name: /Contacts \/ NOK/ }).click()
  await page.getByRole("button", { name: "Edit contacts", exact: true }).click()
  await page
    .getByRole("button", { name: "Remove contact 1", exact: true })
    .click()
  await expect(page.getByRole("dialog")).toContainText("primary")
  await page.getByRole("button", { name: "Keep contact", exact: true }).click()
  await page.getByRole("button", { name: "Add contact", exact: true }).click()
  const row = page.getByRole("region", { name: "Contact 3", exact: true })
  await row.getByLabel("Full name", { exact: true }).fill("Fictional New NOK")
  await row.getByLabel("Relationship", { exact: true }).fill("Friend")
  await row.getByLabel("Phone", { exact: true }).fill("000 000 9000")
  await row.getByLabel("Primary contact", { exact: true }).check()
  await row.getByLabel("Emergency contact", { exact: true }).check()
  await expect(
    page
      .locator(".ad-contact-flags label")
      .filter({ hasText: "Primary contact" })
      .locator("input:checked"),
  ).toHaveCount(1)
  await page
    .getByRole("button", { name: "Remove contact 2", exact: true })
    .click()
  await expect(page.getByRole("dialog")).toContainText("emergency")
  await page
    .getByRole("button", { name: "Confirm removal", exact: true })
    .click()
  await page.getByRole("button", { name: "Save contacts", exact: true }).click()
  await expect(page.getByText("Devon Reed", { exact: true })).toHaveCount(0)
  await expect(
    page.getByText("Fictional New NOK", { exact: true }),
  ).toBeVisible()
  await employee(page)
  await page
    .getByRole("button", { name: "View Staff preview", exact: true })
    .click()
  await page
    .locator(".cm-sidebar-nav")
    .getByRole("button", { name: "Houses", exact: true })
    .click()
  await page
    .locator(".cm-house-card")
    .filter({ hasText: "Riverside Lodge" })
    .click()
  await page
    .locator(".cm-client-card")
    .filter({ hasText: "Taylor Reed" })
    .click()
  await expect(
    page.getByText("Fictional New NOK", { exact: true }),
  ).toBeVisible()
  await expect(page.getByText("000 000 9000", { exact: true })).toBeVisible()
})
test("client transfer changes Staff audience and retains shared documentation counts", async ({
  page,
}) => {
  desktop(page)
  await enter(page)
  await client(page)
  await page.getByRole("tab", { name: "Diary", exact: true }).click()
  await expect(page).toHaveURL(/tab=diary$/)
  await expect(
    page.getByRole("heading", {
      name: "Shared documentation preview",
      exact: true,
    }),
  ).toBeVisible()
  const before = await page.locator(".ad-panel").textContent()
  await page.getByRole("tab", { name: "House assignment", exact: true }).click()
  await page.getByRole("button", { name: "Change house", exact: true }).click()
  await page.getByLabel("New house", { exact: true }).selectOption("h3")
  await page
    .getByRole("button", { name: "Review transfer", exact: true })
    .click()
  await expect(page.getByRole("dialog")).toContainText(
    "Historical access policy",
  )
  await page
    .getByRole("button", { name: "Confirm transfer", exact: true })
    .click()
  await expect(page.locator(".ad-kv")).toContainText("Cedar Hill")
  await page.getByRole("tab", { name: "Diary", exact: true }).click()
  await expect(page.locator(".ad-panel")).toHaveText(before ?? "")
  await employee(page)
  await page
    .getByRole("button", { name: "View Staff preview", exact: true })
    .click()
  await page
    .locator(".cm-sidebar-nav")
    .getByRole("button", { name: "Houses", exact: true })
    .click()
  await page
    .locator(".cm-house-card")
    .filter({ hasText: "Riverside Lodge" })
    .click()
  await expect(
    page.locator(".cm-client-card").filter({ hasText: "Taylor Reed" }),
  ).toHaveCount(0)
})
test("Manager Administrator and ordinary Staff permission previews remain distinct", async ({
  page,
}) => {
  desktop(page)
  await enter(page)
  await employee(page, "Example Administrator")
  await page.getByRole("button", { name: "Edit employee", exact: true }).click()
  await expect(page).toHaveURL(/\/admin\/employees\/a1\/edit$/)
  await page.goBack()
  await expect(page).toHaveURL(/\/admin\/employees\/a1$/)
  await role(page, "Manager")
  await page.goForward()
  await expect(
    page.getByText(
      "Administrator accounts can only be edited by an Administrator.",
      { exact: true },
    ),
  ).toBeVisible()
  await employee(page)
  await page.getByRole("button", { name: "Edit employee", exact: true }).click()
  await expect(
    page
      .getByLabel("Role", { exact: true })
      .locator('option[value="Administrator"]'),
  ).toBeDisabled()
  await role(page, "Staff")
  await expect(
    page.getByText(
      "Staff and Senior Staff cannot use Admin management screens or mutations.",
      { exact: true },
    ),
  ).toBeVisible()
  await expect(page.getByLabel("Work email", { exact: true })).toHaveCount(0)
  await role(page, "Senior Staff")
  await expect(
    page.getByRole("button", {
      name: "Open Administrator preview",
      exact: true,
    }),
  ).toBeVisible()
})
test("Admin direct refresh invalid IDs and Staff boundaries keep generic unavailable states", async ({
  page,
}) => {
  desktop(page)
  await enter(page)
  await employee(page)
  await page.reload()
  await expect(
    page.getByText(
      "Staff and Senior Staff cannot use Admin management screens or mutations.",
      { exact: true },
    ),
  ).toBeVisible()
  await page
    .getByRole("button", { name: "Open Administrator preview", exact: true })
    .click()
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Jamie Taufa",
  )
  for (const path of [
    "/admin/employees/missing",
    "/admin/houses/missing",
    "/admin/clients/missing",
    "/admin/clients/c1?tab=unknown",
    "/clients/c4",
    "/houses/h3",
  ]) {
    const response = await page.goto(path)
    expect(response?.status(), path).toBe(404)
  }
})
test("Admin unsaved forms validate labels and keyboard discard guards", async ({
  page,
}) => {
  desktop(page)
  await enter(page)
  await nav(page, "Employees")
  await page
    .getByRole("button", { name: "Create employee", exact: true })
    .click()
  await page.getByLabel("First name", { exact: true }).fill("Unsaved")
  page.once("dialog", (d) => d.dismiss())
  await page
    .locator(".ad-nav")
    .getByRole("link", { name: "Houses", exact: true })
    .click()
  await expect(page.getByLabel("First name", { exact: true })).toHaveValue(
    "Unsaved",
  )
  page.once("dialog", (d) => d.dismiss())
  await page.goBack()
  await expect(page.getByLabel("First name", { exact: true })).toHaveValue(
    "Unsaved",
  )
  page.once("dialog", (d) => d.accept())
  await page.getByRole("button", { name: "Cancel", exact: true }).click()
  await expect(page).toHaveURL(/\/admin\/employees$/)
  await bounds(page)
})
test("employee table pagination and role house status filters work with session-created records", async ({
  page,
}) => {
  desktop(page)
  await enter(page)
  await nav(page, "Employees")
  await page.getByLabel("Role", { exact: true }).selectOption("Manager")
  await expect(
    page.getByRole("row").filter({ hasText: "Mere Walker" }),
  ).toHaveCount(1)
  await expect(
    page.getByRole("row").filter({ hasText: "Jamie Taufa" }),
  ).toHaveCount(0)
  await page.getByLabel("Role", { exact: true }).selectOption("all")
  await page.getByLabel("House", { exact: true }).selectOption("h1")
  await expect(
    page.getByRole("row").filter({ hasText: "Jamie Taufa" }),
  ).toHaveCount(1)
  await expect(
    page.getByRole("row").filter({ hasText: "Sam Wilson" }),
  ).toHaveCount(0)
  await page.getByLabel("House", { exact: true }).selectOption("all")
  await page.getByLabel("Status", { exact: true }).selectOption("Invited")
  await expect(
    page.getByText("No employees match your filters", { exact: true }),
  ).toBeVisible()
  await page.getByRole("button", { name: "Clear filters", exact: true }).click()
  for (let i = 0; i < 5; i++) {
    await page
      .getByRole("button", { name: "Create employee", exact: true })
      .click()
    await expect(page.getByLabel("First name", { exact: true })).toBeVisible()
    for (const [label, value] of [
      ["First name", "Fictional"],
      ["Last name", `Page ${i}`],
      ["Employee ID", `EMP-PAGE-${i}`],
      ["Work email", `page${i}@example.invalid`],
    ])
      await page.getByLabel(label, { exact: true }).fill(value)
    await page
      .getByRole("button", { name: "Create employee", exact: true })
      .click()
    await expect(page).toHaveURL(/saved=1$/)
    await nav(page, "Employees")
  }
  await expect(page.locator(".ad-table tbody tr")).toHaveCount(10)
  await page.getByRole("button", { name: "Next page", exact: true }).click()
  await expect(page.locator(".ad-table tbody tr")).toHaveCount(1)
  await page.getByPlaceholder("Search name, email or employee ID").fill("Jamie")
  await expect(
    page.getByRole("row").filter({ hasText: "Jamie Taufa" }),
  ).toHaveCount(1)
  await expect(
    page.getByRole("button", { name: "Next page", exact: true }),
  ).toHaveCount(0)
})
test("House directory counts cards list search and status filters derive from relationships", async ({
  page,
}) => {
  desktop(page)
  await enter(page)
  await nav(page, "Houses")
  await expect(page.locator(".ad-house-card")).toHaveCount(3)
  await page
    .getByPlaceholder("Search houses", { exact: true })
    .fill("Riverside")
  await expect(page.locator(".ad-house-card")).toHaveCount(1)
  await expect(page.locator(".ad-house-card")).toContainText("2 clients")
  await expect(page.locator(".ad-house-card")).toContainText("2 staff")
  await page.getByRole("button", { name: "List", exact: true }).click()
  const row = page.getByRole("row").filter({ hasText: "Riverside Lodge" })
  await expect(row.getByRole("cell").nth(2)).toHaveText("2")
  await expect(row.getByRole("cell").nth(3)).toHaveText("2")
  await page.getByLabel("Status", { exact: true }).selectOption("Inactive")
  await expect(page.getByText("No houses found", { exact: true })).toBeVisible()
  await bounds(page)
})
test("Client directory filters and edit validation retain contacts and Staff profile content", async ({
  page,
}) => {
  desktop(page)
  await enter(page)
  await nav(page, "Clients")
  await page.getByLabel("House", { exact: true }).selectOption("h2")
  await expect(
    page.getByRole("row").filter({ hasText: "Jordan Quinn" }),
  ).toHaveCount(1)
  await expect(
    page.getByRole("row").filter({ hasText: "Taylor Reed" }),
  ).toHaveCount(0)
  await page.getByLabel("House", { exact: true }).selectOption("all")
  await page.getByPlaceholder("Search client name or reference").fill("Taylor")
  await page
    .getByRole("row")
    .filter({ hasText: "Taylor Reed" })
    .getByRole("button", { name: "Edit", exact: true })
    .click()
  await expect(page.getByLabel("Current house", { exact: true })).toBeDisabled()
  await page.getByLabel("Client reference", { exact: true }).fill("CLIENT-2")
  await page.getByRole("button", { name: "Save client", exact: true }).click()
  await expect(page.locator(".ad-entity-form > [role=alert]")).toContainText(
    "unique client reference",
  )
  await page.getByLabel("Client reference", { exact: true }).fill("CLIENT-1")
  await page
    .getByLabel("Profile summary", { exact: true })
    .fill("Updated fictional support profile for UI review.")
  await page.getByRole("button", { name: "Save client", exact: true }).click()
  await expect(page).toHaveURL(/\/admin\/clients\/c1\?saved=1$/)
  await page.getByRole("tab", { name: /Contacts \/ NOK/ }).click()
  await expect(page.getByText("Morgan Reed", { exact: true })).toBeVisible()
  await employee(page)
  await page
    .getByRole("button", { name: "View Staff preview", exact: true })
    .click()
  await page
    .locator(".cm-sidebar-nav")
    .getByRole("button", { name: "Houses", exact: true })
    .click()
  await page
    .locator(".cm-house-card")
    .filter({ hasText: "Riverside Lodge" })
    .click()
  await page
    .locator(".cm-client-card")
    .filter({ hasText: "Taylor Reed" })
    .click()
  await expect(
    page.getByText("Updated fictional support profile for UI review.", {
      exact: true,
    }),
  ).toBeVisible()
})
