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
  await page.goto("/login")
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
    await page.goto("/login")
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
  await expect(page.getByText("Signed in as Robin Sample")).toBeVisible()
  const deferredStaff = await (await page.request.get("/houses")).text()
  expect(deferredStaff.includes("NEXT_HTTP_ERROR_FALLBACK;404")).toBe(true)
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
  await page.getByRole("button", { name: "Sign out", exact: true }).click()
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
    expect((await page.request.get("/api/admin/foundation")).status()).toBe(200)
  } finally {
    await db.user.update({ where: { id: id.staffA }, data: { role: "STAFF" } })
  }
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
    await page.goto("/login")
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
  if (testInfo.project.name === "backend-375")
    await expect(
      page.getByRole("heading", { name: "Desktop required" }),
    ).toBeVisible()
  else
    await expect(
      page.getByRole("heading", { name: "Administration", exact: true }),
    ).toBeVisible()
  expect((await page.request.get("/admin/documentation")).status()).toBe(404)
})
