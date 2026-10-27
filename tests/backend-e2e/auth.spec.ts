import { test, expect } from "@playwright/test"
import { readFile } from "node:fs/promises"
import { PrismaClient } from "../../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { seedIds as id, seedEmployees } from "../../prisma/seed-data"
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})
let credentials: Record<string, string>
test.beforeAll(async () => {
  credentials = JSON.parse(
    await readFile(process.env.CAREMETRICS_SEED_CREDENTIALS_FILE!, "utf8"),
  )
})
test.beforeEach(async () => {
  await db.loginAttempt.deleteMany()
})
test.afterAll(async () => {
  await db.$disconnect()
})
async function login(
  page: import("@playwright/test").Page,
  who = id.staffA as string,
) {
  const account = seedEmployees.find((e) => e.id === who)!
  await page.goto("/login", { waitUntil: "domcontentloaded" })
  await page.getByLabel("Email address", { exact: true }).fill(account.email)
  await page
    .getByLabel("Password", { exact: true })
    .fill(credentials[account.email])
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  await expect(page).toHaveURL(/\/shift-check$/)
}
test("unauthenticated direct entry and APIs fail closed; auth has origin and CSRF protection", async ({
  page,
  request,
}) => {
  await page.goto("/shift-check")
  await expect(page).toHaveURL(/\/login$/)
  expect((await request.get("/api/me")).status()).toBe(401)
  expect(
    (
      await request.post("/api/auth/callback/credentials", {
        headers: { Origin: "https://untrusted.example" },
        form: { email: "invalid", password: "invalid" },
      })
    ).status(),
  ).toBe(403)
  const csrf = await request.post("/api/auth/callback/credentials", {
    headers: { Origin: "http://localhost:8558" },
    form: { email: "invalid", password: "invalid" },
  })
  expect(csrf.status()).not.toBe(200)
  const forged = await request.get("/api/me", {
    headers: {
      Cookie: "authjs.session-token=forged-client-role.ADMINISTRATOR",
    },
  })
  expect(forged.status()).toBe(401)
})
test("invalid and unknown credentials give generic feedback with no session", async ({
  page,
}) => {
  for (const email of [
    seedEmployees[2].email,
    "unknown@caremetrics.example.test",
  ]) {
    await page.goto("/login", { waitUntil: "domcontentloaded" })
    await page.getByLabel("Email address", { exact: true }).fill(email)
    await page.getByLabel("Password", { exact: true }).fill("incorrect")
    await page.getByRole("button", { name: "Sign in", exact: true }).click()
    await expect(
      page.getByRole("alert").filter({ hasText: "Unable to sign in" }),
    ).toHaveText("Unable to sign in. Check your details or contact management.")
    expect((await page.request.get("/api/me")).status()).toBe(401)
  }
})
test("genuine login preserves My Shifts → Dashboard without clock-in; scoped reads and revoked logout", async ({
  page,
  context,
}) => {
  await login(page)
  await expect(
    page.getByRole("button", { name: "Preview administration" }),
  ).toHaveCount(0)
  const me = await page.request.get("/api/me")
  expect(me.status()).toBe(200)
  const body = await me.json()
  expect(body.id).toBe(id.staffA)
  expect("passwordHash" in body).toBe(false)
  expect(me.headers()["cache-control"]).toContain("no-store")
  const houses = await (await page.request.get("/api/houses")).json()
  expect(houses.map((h: { id: string }) => h.id)).toEqual([id.houseA])
  expect((await page.request.get(`/api/clients/${id.clientA}`)).status()).toBe(
    200,
  )
  expect((await page.request.get(`/api/clients/${id.clientB}`)).status()).toBe(
    404,
  )
  expect(
    (await page.request.get(`/api/houses/${id.houseB}/clients`)).status(),
  ).toBe(404)
  expect((await page.request.get("/api/admin/foundation")).status()).toBe(403)
  await page.evaluate(() => {
    sessionStorage.setItem(
      "caremetrics-development-mock-session",
      "fictional-staff-preview",
    )
  })
  expect((await page.request.get("/api/admin/foundation")).status()).toBe(403)
  await page.getByRole("link", { name: "Continue to dashboard" }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await page.reload()
  await expect(page.locator(".cm-me-card")).toContainText("Robin Walker")
  const houseCard = page.locator(".cm-house-mini").first()
  await expect(houseCard).toContainText("Harbour House")
  await expect(houseCard).toBeVisible()
  await expect
    .poll(() =>
      houseCard.evaluate((card) => {
        const outer = card.getBoundingClientRect()
        const label = card.querySelector("strong")!.getBoundingClientRect()
        return label.height > 0 && label.bottom <= outer.bottom
      }),
    )
    .toBe(true)
  const deferredStaff = await (await page.request.get("/houses")).text()
  expect(deferredStaff).toContain("Harbour House")
  expect(deferredStaff).not.toContain("Meadow House")
  for (const marker of [
    "Jamie Taufa",
    "Taylor Reed",
    "Riverside Lodge",
    "Staff preview provider missing",
  ])
    expect(deferredStaff).not.toContain(marker)
  const deferredAdmin = await (
    await page.request.get("/admin/employees")
  ).text()
  expect(deferredAdmin).not.toContain("Create employee")
  expect(deferredAdmin).not.toContain("Jamie Taufa")
  const cookies = await context.cookies()
  const session = cookies.find((c) => c.name === "authjs.session-token")!
  expect(session.httpOnly).toBe(true)
  expect(session.sameSite).toBe("Lax")
  if ((page.viewportSize()?.width ?? 1280) < 768) {
    await page.getByRole("button", { name: "Menu", exact: true }).click()
    await page
      .getByRole("dialog", { name: "Menu" })
      .getByRole("button", { name: "Sign out", exact: true })
      .click()
  } else
    await page
      .locator(".cm-sidebar")
      .getByRole("button", { name: "Sign out", exact: true })
      .click()
  await expect(page).toHaveURL(/\/login$/)
  expect((await page.request.get("/api/me")).status()).toBe(401)
  expect(
    (
      await page.request.get("/api/me", {
        headers: { Cookie: `${session.name}=${session.value}` },
      })
    ).status(),
  ).toBe(401)
})
test("active-session role/assignment changes and deactivation apply on next server query", async ({
  page,
}) => {
  await login(page)
  const key = {
    organisationId_employeeId_houseId: {
      organisationId: id.organisation,
      employeeId: id.staffA,
      houseId: id.houseA,
    },
  }
  await db.employeeHouseAssignment.update({
    where: key,
    data: { active: false },
  })
  try {
    expect(
      (await page.request.get(`/api/clients/${id.clientA}`)).status(),
    ).toBe(404)
  } finally {
    await db.employeeHouseAssignment.update({
      where: key,
      data: { active: true },
    })
  }
  await db.user.update({ where: { id: id.staffA }, data: { role: "MANAGER" } })
  try {
    expect((await page.request.get("/api/admin/foundation")).status()).toBe(401)
    await page.context().clearCookies()
    await login(page)
    expect((await page.request.get("/api/admin/foundation")).status()).toBe(200)
  } finally {
    await db.user.update({ where: { id: id.staffA }, data: { role: "STAFF" } })
  }
  expect((await page.request.get("/api/admin/foundation")).status()).toBe(401)
  await page.context().clearCookies()
  await login(page)
  expect((await page.request.get("/api/admin/foundation")).status()).toBe(403)
  await db.user.update({
    where: { id: id.staffA },
    data: { status: "INACTIVE" },
  })
  try {
    expect((await page.request.get("/api/me")).status()).toBe(401)
    expect(
      await (await page.request.get("/api/auth/session")).json(),
    ).toBeNull()
    await page.goto("/login", { waitUntil: "domcontentloaded" })
    await page
      .getByLabel("Email address", { exact: true })
      .fill(seedEmployees[2].email)
    await page
      .getByLabel("Password", { exact: true })
      .fill(credentials[seedEmployees[2].email])
    await page.getByRole("button", { name: "Sign in", exact: true }).click()
    await expect(
      page.getByRole("alert").filter({ hasText: "Unable to sign in" }),
    ).toBeVisible()
  } finally {
    await db.user.update({
      where: { id: id.staffA },
      data: { status: "ACTIVE" },
    })
  }
  expect((await page.request.get("/api/me")).status()).toBe(401)
})
test("management reads stay tenant-scoped and Admin keeps the desktop gate", async ({
  page,
}, testInfo) => {
  await login(page, id.manager)
  expect((await page.request.get("/api/admin/foundation")).status()).toBe(200)
  expect((await (await page.request.get("/api/houses")).json()).length).toBe(2)
  await page.goto("/admin/dashboard")
  if ((testInfo.project.use.viewport?.width ?? 1280) < 1024)
    await expect(
      page.getByRole("heading", { name: "Desktop required" }),
    ).toBeVisible()
  else
    await expect(
      page.getByRole("heading", { name: "Administration", exact: true }),
    ).toBeVisible()
  const deferred = await page.request.get("/admin/documentation")
  expect(deferred.status()).toBe(200)
  expect(await deferred.text()).toContain(
    "This feature is not available in the current CareMetrics version.",
  )
  expect(await deferred.text()).not.toContain("Publish template")
})

test("real Staff journey shares assigned database records across houses, profiles, NOK and search", async ({
  page,
}) => {
  await login(page)
  await page.getByRole("link", { name: "Continue to dashboard" }).click()
  await page.goto("/houses")
  await expect(
    page.getByRole("heading", { name: "My houses", exact: true }),
  ).toBeVisible()
  await page.locator(".cm-house-card").first().click()
  await expect(page).toHaveURL(new RegExp(`/houses/${id.houseA}$`))
  await page.locator(".cm-client-card").first().click()
  await expect(page).toHaveURL(/\/clients\//)
  await page.getByRole("link", { name: "View contacts & next of kin" }).click()
  await expect(
    page.getByText("Taylor Parker", { exact: true }).first(),
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByText("Taylor Parker", { exact: true }).first(),
  ).toBeVisible()
  const own = await db.client.findUniqueOrThrow({ where: { id: id.clientA } })
  await page.goto("/search")
  await page
    .getByRole("searchbox", { name: "Search clients and houses" })
    .fill(own.name)
  await expect(page).toHaveURL(new RegExp("/search\\?q="))
  await expect(page.locator(".cm-content")).toContainText(own.name)
  const results = await (
    await page.request.get(`/api/search?q=${encodeURIComponent(own.name)}`)
  ).json()
  expect(results.clients.map((c: { id: string }) => c.id)).toContain(id.clientA)
  expect(results.clients.map((c: { id: string }) => c.id)).not.toContain(
    id.clientB,
  )
  await page.goto("/profile")
  await expect(
    page.getByRole("region", { name: "Current employee" }),
  ).toContainText("Robin Walker")
  if (page.viewportSize()?.width === 390)
    await page.screenshot({ path: "/tmp/caremetrics-2b-staff-390.png" })
  await page.goto(`/clients/${id.clientB}`)
  await expect(
    page.getByRole("heading", { name: "Record could not be found" }),
  ).toBeVisible()
  await page.goto(`/houses/${id.houseA}?tab=diary`)
  await expect(
    page.getByRole("heading", { name: "Future Development", exact: true }),
  ).toBeVisible()
  // This original journey must never create attendance in its own seed organisation.
  expect(
    await db.attendanceRecord.count({
      where: { organisationId: id.organisation },
    }),
  ).toBe(0)
  if ((page.viewportSize()?.width ?? 1280) < 768) {
    await page.getByRole("button", { name: "Menu", exact: true }).click()
    await page
      .getByRole("dialog", { name: "Menu" })
      .getByRole("button", { name: "Sign out", exact: true })
      .click()
  } else
    await page
      .locator(".cm-sidebar")
      .getByRole("button", { name: "Sign out", exact: true })
      .click()
  await expect(page).toHaveURL(/\/login$/)
  expect((await page.request.get("/api/search")).status()).toBe(401)
})
test("second employee and management UI read the same records with different access", async ({
  page,
}) => {
  await login(page, id.staffB)
  await page.goto("/houses")
  await expect(page.locator(".cm-content")).toContainText("Meadow House")
  await expect(page.locator(".cm-content")).not.toContainText("Harbour House")
  const search = await (await page.request.get("/api/search")).json()
  expect(search.houses.map((h: { id: string }) => h.id)).toEqual([id.houseB])
  await page.context().clearCookies()
  await login(page, id.manager)
  await page.goto("/admin/employees")
  if ((page.viewportSize()?.width ?? 1280) >= 1024) {
    await page.getByRole("link", { name: "Robin Walker", exact: true }).click()
    await expect(page.locator(".ad-main")).toContainText("Harbour House")
    await page.goto(`/admin/clients/${id.clientA}?tab=contacts`)
    await expect(page.locator(".ad-main")).toContainText("Taylor Parker")
    await page.screenshot({ path: "/tmp/caremetrics-2b-admin-1280.png" })
    await expect(
      page.getByRole("button", { name: "Edit", exact: true }),
    ).toHaveCount(0)
  }
})
