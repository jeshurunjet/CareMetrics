import { hasUiReference } from "../reference-availability"
import { test, expect } from "@playwright/test"
import type { Page } from "@playwright/test"
import { writeFile, mkdir } from "node:fs/promises"
const fixed = "2026-10-22T01:00:00.000Z"
async function login(page: Page) {
  await page.goto("/login")
  await page.getByLabel("Email address").fill("fictional@example.invalid")
  await page.getByLabel("Password", { exact: true }).fill("fictional-input")
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  await expect(page).toHaveURL(/\/shift-check$/)
}
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date(fixed))
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
test("mock login → three shifts → dashboard without attendance, refresh and back", async ({
  page,
}) => {
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  await login(page)
  await expect(page.getByTestId("shift-row")).toHaveCount(3)
  await expect(page.locator("[data-highlighted=true]")).toHaveCount(1)
  await expect(
    page.getByRole("button", { name: "Clock in unavailable", exact: true }),
  ).toBeDisabled()
  await page
    .getByRole("button", { name: "Continue to dashboard", exact: true })
    .filter({ visible: true })
    .first()
    .click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(
    page.getByRole("heading", { name: "Welcome back, Jamie" }),
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole("heading", { name: "Welcome back, Jamie" }),
  ).toBeVisible()
  await page.goBack()
  await expect(page).toHaveURL(/\/shift-check$/)
  expect(errors).toEqual([])
})
test("dashboard assignments, clients, coworkers and destination routes", async ({
  page,
}) => {
  await page.goto("/dashboard")
  await expect(page.locator(".cm-house-mini")).toHaveCount(2)
  await expect(page.locator(".cm-client-card")).toHaveCount(3)
  await expect(page.locator(".cm-notice-row")).toHaveCount(3)
  await expect(page.getByText("Unassigned Example")).toHaveCount(0)
  await expect(page.getByText("Alex Morgan", { exact: true })).toBeVisible()
  await page.getByLabel("Select house").selectOption("h2")
  await expect(page.getByText("Sam Wilson", { exact: true })).toBeVisible()
  await page.locator(".cm-house-mini").nth(1).click()
  await expect(page).toHaveURL(/\/houses\/h2$/)
  await expect(
    page.getByRole("heading", { name: "Sunrise House", exact: true }),
  ).toBeVisible()
  await page.getByRole("button", { name: "Go back" }).click()
  await page.locator(".cm-client-card").last().click()
  await expect(page).toHaveURL(/\/clients\/c3$/)
  await page.goBack()
  await page.getByRole("button", { name: "Team schedule" }).click()
  await expect(page).toHaveURL(/\/roster\?tab=team$/)
  await page.goto("/clients/c4")
  await expect(
    page.getByRole("heading", { name: /not be found/i }),
  ).toBeVisible()
})
test("GPS unavailable/denied and active appearance never enable attendance", async ({
  page,
}) => {
  await page.goto("/shift-check")
  await expect(
    page.getByText("Location unavailable · preview", { exact: true }),
  ).toBeVisible()
  await page
    .getByRole("button", { name: "Permission denied", exact: true })
    .click()
  await expect(
    page.getByText("Location access denied · preview", { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Clock in unavailable", exact: true }),
  ).toBeDisabled()
  await page.getByRole("button", { name: "Retry location check" }).click()
  await expect(
    page.getByText("Location unavailable · preview", { exact: true }),
  ).toBeVisible()
  await page.getByRole("button", { name: "Demo active attendance" }).click()
  await expect(page.getByText("Demo clocked in", { exact: true })).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Clock out unavailable" }),
  ).toBeDisabled()
  await page.getByTestId("shift-row").first().getByRole("button").click()
  await expect(
    page.getByRole("dialog", { name: "Shift details" }),
  ).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog")).toHaveCount(0)
})
test("login validation, show password and honest recovery", async ({
  page,
}) => {
  await page.goto("/login")
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  await expect(page.locator(".login-card [role=alert]")).toContainText(
    "Please enter",
  )
  await page.getByLabel("Password", { exact: true }).fill("fictional-input")
  await page.getByRole("button", { name: "Show password" }).click()
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
    "type",
    "text",
  )
  await page.getByRole("button", { name: "Forgot your password?" }).click()
  await page.getByLabel("Email address").fill("fictional@example.invalid")
  await page.getByRole("button", { name: "Send reset link" }).click()
  await expect(page.locator(".login-card [role=alert]")).toContainText(
    "No email has been sent",
  )
})
test("navigation and Admin desktop gate remain responsive", async ({
  page,
}) => {
  await page.goto("/dashboard")
  const width = page.viewportSize()!.width
  if (width < 1024) {
    await expect(page.locator(".cm-bottom-nav")).toBeVisible()
    await expect(page.locator(".cm-sidebar")).toBeHidden()
    await page.getByRole("button", { name: "Menu", exact: true }).click()
    await page
      .getByRole("dialog", { name: "Menu" })
      .getByRole("button", { name: /Notifications/ })
      .click()
    await expect(page).toHaveURL(/\/notifications$/)
  } else {
    await expect(page.locator(".cm-sidebar")).toBeVisible()
    await expect(page.locator(".cm-bottom-nav")).toBeHidden()
    await page
      .locator(".cm-sidebar")
      .getByRole("button", { name: "Leave", exact: true })
      .click()
    await expect(page).toHaveURL(/\/leave$/)
  }
  await page.goto("/admin/dashboard")
  await expect(page.locator(".ad-desktop-guard")).toBeVisible({
    visible: width < 1024,
  })
  await expect(page.locator(".ad-app")).toBeVisible({ visible: width >= 1024 })
})
test("capture migrated and original export screens for visual comparison", async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  const capture = async (name: string) => {
    await page.evaluate(() => document.fonts.ready)
    const styles = await page.evaluate(() => ({
      fonts: Array.from(document.fonts).map((f) => ({
        family: f.family,
        status: f.status,
      })),
      vars: {
        display: getComputedStyle(document.documentElement).getPropertyValue(
          "--font-display",
        ),
        sans: getComputedStyle(document.documentElement).getPropertyValue(
          "--font-sans",
        ),
      },
      items: [
        ".cm-page-title h1",
        ".cm-mobile-brand",
        ".login-card h2",
        ".cm-house-mini",
      ].map((sel) => {
        const el = document.querySelector(sel)
        if (!el) return null
        const c = getComputedStyle(el)
        return {
          selector: sel,
          font: c.fontFamily,
          weight: c.fontWeight,
          size: c.fontSize,
          width: c.width,
          border: c.borderRadius,
        }
      }),
    }))
    await mkdir("test-results/visual", { recursive: true })
    await writeFile(
      `test-results/visual/${info.project.name}-${name}.json`,
      JSON.stringify(styles, null, 2),
    )
    await page.screenshot({
      animations: "disabled",
      path: `test-results/visual/${info.project.name}-${name}.png`,
    })
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)
  }
  await page.goto("/login")
  await capture("migrated-login")
  await page.goto("/shift-check")
  await expect(page.locator(".leaflet-container")).toBeVisible()
  await capture("migrated-shifts")
  await page
    .locator(".cm-content")
    .evaluate((el) => el.scrollTo(0, el.scrollHeight))
  await capture("migrated-shifts-bottom")
  await page.goto("/dashboard")
  await expect(
    page.getByRole("heading", { name: "Welcome back, Jamie" }),
  ).toBeVisible()
  await capture("migrated-dashboard")
  await page
    .locator(".cm-content")
    .evaluate((el) => el.scrollTo(0, el.scrollHeight))
  await capture("migrated-dashboard-bottom")
  if (!hasUiReference) {
    expect(errors).toEqual([])
    test.info().annotations.push({
      type: "note",
      description:
        "Original export comparison omitted: local reference unavailable or disabled.",
    })
    return
  }
  await page.goto("http://localhost:8557/?screen=login")
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible()
  await capture("original-login")
  await page.goto("http://localhost:8557/")
  await expect(page.locator(".cm-shift-hero")).toBeVisible()
  await page.getByRole("button", { name: "No signal", exact: true }).click()
  await page.waitForTimeout(1400)
  await page.locator(".cm-content").evaluate((el) => el.scrollTo(0, 0))
  await capture("original-shifts")
  await page
    .locator(".cm-content")
    .evaluate((el) => el.scrollTo(0, el.scrollHeight))
  await capture("original-shifts-bottom")
  await page
    .locator(".cm-sidebar-nav,.cm-bottom-nav")
    .getByRole("button", { name: "Home", exact: true })
    .filter({ visible: true })
    .click()
  await expect(
    page.getByRole("heading", { name: "Welcome back, Jamie" }),
  ).toBeVisible()
  await page.locator(".cm-content").evaluate((el) => el.scrollTo(0, 0))
  await capture("original-dashboard")
  await page
    .locator(".cm-content")
    .evaluate((el) => el.scrollTo(0, el.scrollHeight))
  await capture("original-dashboard-bottom")
  expect(errors).toEqual([])
})
