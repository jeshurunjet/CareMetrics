import { test, expect, type Page } from "@playwright/test"
import { randomBytes, randomUUID } from "node:crypto"
import { PrismaClient, type Prisma } from "../../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { hashPassword } from "../../src/server/auth/password"
import { careFormV1 } from "../fixtures/care-plan"
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})
const org = "25000000-0000-4000-8000-000000000001"
let staff: string,
  manager: string,
  house: string,
  client: string,
  template: string,
  password: string
const emails = new Map<string, string>()
test.beforeAll(async () => {
  if (
    !["local-test", "phase-2a"].includes(process.env.NEON_BRANCH_NAME ?? "") ||
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  )
    throw new Error("Isolated fictional readiness checks required")
  const tenant = await db.organisation.upsert({
    where: { id: org },
    create: { id: org, name: "Fictional Mobile Readiness Organisation" },
    update: {},
  })
  expect(tenant.name).toBe("Fictional Mobile Readiness Organisation")
})
test.beforeEach(async () => {
  password = randomBytes(32).toString("base64url")
  const passwordHash = await hashPassword(password)
  for (const role of ["STAFF", "MANAGER"] as const) {
    const user = await db.user.create({
      data: {
        organisationId: org,
        employeeCode: randomUUID(),
        name: `Fictional Mobile ${role}`,
        email: `mobile-${randomUUID()}@example.test`,
        role,
        status: "ACTIVE",
        passwordHash,
      },
    })
    emails.set(user.id, user.email)
    if (role === "STAFF") staff = user.id
    else manager = user.id
  }
  house = (
    await db.house.create({
      data: {
        organisationId: org,
        code: randomUUID(),
        name: "Fictional Mobile House",
        address: "Fictional only",
      },
    })
  ).id
  await db.employeeHouseAssignment.create({
    data: { organisationId: org, employeeId: staff, houseId: house },
  })
  client = (
    await db.client.create({
      data: {
        organisationId: org,
        houseId: house,
        reference: randomUUID(),
        name: "Fictional Mobile Client",
      },
    })
  ).id
  template = (
    await db.careTemplate.create({
      data: { organisationId: org, name: "Fictional Mobile Review" },
    })
  ).id
  await db.careTemplateVersion.create({
    data: {
      organisationId: org,
      templateId: template,
      version: 1,
      definition: careFormV1 as unknown as Prisma.InputJsonObject,
    },
  })
  await db.clientTemplateAssignment.create({
    data: {
      organisationId: org,
      clientId: client,
      templateId: template,
      version: 1,
    },
  })
})
test.afterEach(async () => {
  await db.user.updateMany({
    where: { organisationId: org, id: { in: [staff, manager] } },
    data: { status: "INACTIVE" },
  })
})
test.afterAll(async () => {
  await db.$disconnect()
})
async function login(page: Page, id = staff) {
  await page.goto("/")
  await expect(page).toHaveURL(/\/login$/)
  await page.getByRole("button", { name: "Show password", exact: true }).click()
  await page.getByRole("button", { name: "Hide password", exact: true }).click()
  await page.getByLabel("Email address", { exact: true }).fill(emails.get(id)!)
  await page.getByLabel("Password", { exact: true }).fill(password)
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  await expect(page).toHaveURL(/\/shift-check$/)
}
async function noOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      ),
    )
    .toBeLessThanOrEqual(1)
}
async function signout(page: Page) {
  const menu = page.getByRole("button", { name: "Menu", exact: true })
  await expect
    .poll(
      async () =>
        (await menu.isVisible()) ||
        (await page
          .getByRole("button", { name: "Sign out", exact: true })
          .isVisible()),
    )
    .toBe(true)
  if (await menu.isVisible()) await menu.click()
  await page.getByRole("button", { name: "Sign out", exact: true }).click()
  await expect(page).toHaveURL(/\/login$/)
}
test("PWA public manifest/icons, secure launch, online-only sessions and feature gates", async ({
  page,
  context,
  request,
}) => {
  test.setTimeout(120000)
  const response = await request.get("/manifest.webmanifest")
  expect(response.ok()).toBe(true)
  expect(response.headers()["content-type"]).toContain(
    "application/manifest+json",
  )
  const manifest = await response.json()
  expect(manifest).toMatchObject({
    id: "/",
    scope: "/",
    start_url: "/",
    display: "standalone",
  })
  for (const icon of manifest.icons) {
    const res = await request.get(icon.src)
    expect(res.ok()).toBe(true)
    expect(res.headers()["content-type"]).toContain("image/png")
    const bytes = await res.body()
    expect(bytes.readUInt32BE(16)).toBe(Number(icon.sizes.split("x")[0]))
  }
  await page.emulateMedia({ reducedMotion: "reduce" })
  await login(page)
  await page.goto("/")
  await expect(page).toHaveURL(/\/shift-check$/)
  await noOverflow(page)
  const html = await page.request.get("/dashboard")
  // Next dev overrides page Cache-Control; the production HTTP probe requires no-store.
  expect(html.headers()["cache-control"]).toMatch(/no-store|no-cache/)
  expect(html.headers()["permissions-policy"]).toContain("geolocation=(self)")
  const session = await page.request.get("/api/auth/session")
  expect(session.headers()["cache-control"]).toContain("no-store")
  const cookie = (await context.cookies()).find(
    (c) => c.name === "authjs.session-token",
  )!
  expect(cookie.httpOnly).toBe(true)
  expect(cookie.sameSite).toBe("Lax")
  expect((await page.request.get("/api/admin/foundation")).status()).toBe(403)
  const before = await db.auditEvent.count({ where: { organisationId: org } })
  for (const endpoint of [
    "/api/leave",
    "/api/files",
    "/api/notifications",
    "/api/concerns",
    "/api/admin/documentation/templates",
    "/api/admin/documentation/corrections",
    `/api/houses/${house}/diary`,
    `/api/clients/${client}/corrections`,
  ]) {
    for (const method of ["POST", "PATCH", "DELETE"])
      expect(
        (
          await page.request.fetch(endpoint, {
            method,
            data: { role: "ADMINISTRATOR", preview: true },
            headers: { Origin: "http://localhost:8558" },
          })
        ).status(),
      ).toBeGreaterThanOrEqual(400)
  }
  expect(await db.auditEvent.count({ where: { organisationId: org } })).toBe(
    before,
  )
  for (const path of [
    "/leave",
    "/notifications",
    "/settings",
    `/houses/${house}/diary/new`,
    `/clients/${client}?tab=charting`,
    `/clients/${client}?tab=files`,
  ]) {
    await page.goto(path)
    await expect(
      page.getByText(
        "This feature is not available in the current CareMetrics version.",
        { exact: true },
      ),
    ).toBeVisible()
  }
  await page.goto(`/clients/${client}`)
  await context.setOffline(true)
  await expect(
    page.getByRole("heading", { name: "Connection unavailable" }),
  ).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Fictional Mobile Client", exact: true }),
  ).toHaveCount(0)
  await context.setOffline(false)
  await expect(
    page.getByRole("heading", { name: "Fictional Mobile Client", exact: true }),
  ).toBeVisible()
  expect(
    await page.evaluate(
      async () => (await navigator.serviceWorker.getRegistrations()).length,
    ),
  ).toBe(0)
  expect(await page.evaluate(async () => await caches.keys())).toEqual([])
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([])
  const state = await context.storageState()
  const fresh = await page
    .context()
    .browser()!
    .newContext({ storageState: state, viewport: page.viewportSize()! })
  const restored = await fresh.newPage()
  await restored.goto("/")
  await expect(restored).toHaveURL(/\/shift-check$/)
  await fresh.close()
  await signout(page)
  expect((await page.request.get("/api/me")).status()).toBe(401)
  await context.setOffline(true)
  await page.goBack({ waitUntil: "domcontentloaded" }).catch(() => null)
  await expect(
    page.getByRole("heading", { name: "Fictional Mobile Client", exact: true }),
  ).toHaveCount(0)
  await context.setOffline(false)
  await context.addCookies([cookie])
  expect((await page.request.get("/api/me")).status()).toBe(401)
  await page.goto("/")
  await expect(page).toHaveURL(/\/login$/)
})
test("mobile Staff journey, responsive forms and repeating tables at 360 390 412 and tablet", async ({
  page,
}) => {
  test.setTimeout(120000)
  await login(page)
  page.on("dialog", (dialog) => dialog.accept())
  await page
    .getByRole("link", { name: "Continue to dashboard", exact: true })
    .click()
  for (const path of [
    "/houses",
    `/houses/${house}`,
    `/clients/${client}`,
    `/clients/${client}?tab=diary`,
    `/clients/${client}?tab=care`,
    "/profile",
    "/roster?tab=timesheets",
  ]) {
    await page.goto(path)
    await noOverflow(page)
  }
  const widths =
    page.viewportSize()!.width === 390
      ? [360, 390, 412, 768]
      : [page.viewportSize()!.width]
  for (const width of widths) {
    await page.setViewportSize({ width, height: 800 })
    for (const path of [
      "/login",
      "/shift-check",
      "/houses",
      `/houses/${house}`,
      `/clients/${client}`,
      "/roster?tab=timesheets",
      "/leave",
    ]) {
      await page.goto(path)
      await noOverflow(page)
    }
    await page.goto(`/clients/${client}/diary/new`)
    await page
      .getByRole("button", { name: "Submit entry", exact: true })
      .click()
    await expect(
      page.getByText("This field is required.", { exact: true }).first(),
    ).toBeVisible()
    await noOverflow(page)
    await page.goto(`/clients/${client}/records/new?templateId=${template}`)
    await expect(
      page.getByLabel("Original observations", { exact: true }),
    ).toBeVisible()
    await page
      .getByRole("button", { name: "Submit assessment", exact: true })
      .click()
    await expect(
      page.getByText("This field is required.", { exact: true }).first(),
    ).toBeVisible()
    await noOverflow(page)
    await page
      .getByLabel("Support type", { exact: true })
      .selectOption("follow-up")
    await expect(
      page.getByLabel("Follow-up details", { exact: true }),
    ).toBeVisible()
    const add = page.getByRole("button", { name: "Add Row", exact: true })
    await add.click()
    await noOverflow(page)
    if (width === 390)
      await page.screenshot({ path: "/tmp/cm2i-care-390.png", fullPage: true })
    // Browser automation checks focus/scroll; real Android IME and cutouts remain physical acceptance.
    await page.getByLabel("Original observations", { exact: true }).focus()
    await expect(
      page.getByLabel("Original observations", { exact: true }),
    ).toBeFocused()
    await page.setViewportSize({ width, height: 420 })
    await page
      .getByRole("button", { name: "Submit assessment", exact: true })
      .scrollIntoViewIfNeeded()
    await expect(
      page.getByRole("button", { name: "Submit assessment", exact: true }),
    ).toBeVisible()
    // Discard via full navigation after testing unsaved forms.
  }
  await page.goto("/dashboard")
  await signout(page)
})
test("desktop Admin connected management remains usable and deferred modules fail closed", async ({
  page,
}) => {
  test.skip(
    page.viewportSize()!.width < 1024,
    "Administration remains desktop-only",
  )
  await login(page, manager)
  await page.goto("/")
  await expect(page).toHaveURL(/\/admin\/dashboard$/)
  for (const path of [
    "employees",
    "houses",
    "clients",
    "roster?tab=shifts",
    "roster?tab=attendance",
  ]) {
    const response = await page.goto(`/admin/${path}`)
    expect(response?.headers()["cache-control"]).toMatch(/no-store|no-cache/)
    await expect(page.locator(".ad-content")).toBeVisible()
    await expect(
      page.getByText(
        "This feature is not available in the current CareMetrics version.",
        { exact: true },
      ),
    ).toHaveCount(0)
  }
  for (const path of [
    "leave",
    "documentation",
    "documentation/templates/unknown",
    "documentation/corrections/unknown",
    "files",
    "notifications",
    "reports",
    "settings",
    "roster?tab=corrections",
  ]) {
    await page.goto(`/admin/${path}`)
    await expect(
      page.getByText(
        "This feature is not available in the current CareMetrics version.",
        { exact: true },
      ),
    ).toBeVisible()
  }
  await page.goto(`/admin/clients/${client}?tab=care`)
  await expect(
    page.getByText("Fictional Mobile Review", { exact: true }).first(),
  ).toBeVisible()
  await page.screenshot({
    path: "/tmp/cm2i-admin-care-1280.png",
    fullPage: true,
  })
  await page.goto(`/admin/clients/${client}?tab=diary`)
  await expect(page.locator(".ad-content")).toBeVisible()
  await signout(page)
})
