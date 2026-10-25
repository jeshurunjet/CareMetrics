import { test, expect, type Page } from "@playwright/test"
import { readFile } from "node:fs/promises"
import { randomUUID } from "node:crypto"
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
test.afterAll(async () => {
  await db.$disconnect()
})
async function login(page: Page, who: string) {
  await db.loginAttempt.deleteMany()
  const user = seedEmployees.find((e) => e.id === who)!
  await page.goto("/login", { waitUntil: "domcontentloaded" })
  await page.getByLabel("Email address", { exact: true }).fill(user.email)
  await page
    .getByLabel("Password", { exact: true })
    .fill(credentials[user.email])
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  await expect(page).toHaveURL(/\/shift-check$/)
}
async function assignments(
  page: Page,
  employeeId: string,
  houseName: string,
  checked: boolean,
) {
  await page.goto(`/admin/employees/${employeeId}?tab=houses`)
  await page.getByRole("button", { name: "Assign houses", exact: true }).click()
  const modal = page.getByRole("dialog", { name: /Assign houses/ })
  await modal
    .getByRole("checkbox", { name: new RegExp(houseName) })
    .setChecked(checked)
  await modal.getByRole("button", { name: "Save changes", exact: true }).click()
  await expect(modal).toHaveCount(0)
}
test("real Admin forms persist core records, propagate to Staff, reject failed saves and retain audit", async ({
  page,
  browser,
}, testInfo) => {
  test.skip(
    (testInfo.project.use.viewport?.width ?? 1280) < 1024,
    "Admin management UI is desktop only; permission tests still run at all widths.",
  )
  test.setTimeout(120000)
  page.setDefaultTimeout(15000)
  const suffix = randomUUID().slice(0, 8),
    houseName = `Fictional CRUD House ${suffix}`,
    clientName = `Fictional Persistent ${suffix}`,
    employeeCode = `UI-${suffix}`.toUpperCase()
  let houseId: string | undefined,
    clientId: string | undefined,
    employeeId: string | undefined
  await login(page, id.admin)
  const staffContext = await browser.newContext({
      viewport: { width: 390, height: 900 },
      baseURL: "http://localhost:8558",
    }),
    staffPage = await staffContext.newPage()
  const otherContext = await browser.newContext({
      viewport: { width: 390, height: 900 },
      baseURL: "http://localhost:8558",
    }),
    otherPage = await otherContext.newPage()
  try {
    await page.goto("/admin/employees")
    await page
      .getByRole("button", { name: "Create employee", exact: true })
      .click()
    await page.getByLabel("First name", { exact: true }).fill("Fictional")
    await page.getByLabel("Last name", { exact: true }).fill(`CRUD ${suffix}`)
    await page.getByLabel("Employee ID", { exact: true }).fill(employeeCode)
    await page
      .getByLabel("Work email", { exact: true })
      .fill(`fictional-${suffix}@example.test`)
    await expect(
      page.getByText("Separate credential activation required", {
        exact: true,
      }),
    ).toBeVisible()
    await page
      .getByRole("button", { name: "Create employee", exact: true })
      .click()
    await expect(page).toHaveURL(/\/admin\/employees\/[0-9a-f-]+\?saved=1$/)
    employeeId = new URL(page.url()).pathname.split("/").at(-1)!
    const created = await db.user.findUniqueOrThrow({
      where: { id: employeeId },
    })
    expect(created.passwordHash).toBeNull()
    expect(created.status).toBe("INVITED")
    await page
      .getByRole("button", { name: "Edit employee", exact: true })
      .click()
    await page
      .getByLabel("Last name", { exact: true })
      .fill(`Updated ${suffix}`)
    await page.getByLabel("Role", { exact: true }).selectOption("Senior Staff")
    await page
      .getByLabel("Account status", { exact: true })
      .selectOption("Inactive")
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click()
    await expect(
      page.getByRole("heading", {
        name: `Fictional Updated ${suffix}`,
        exact: true,
      }),
    ).toBeVisible()
    expect(
      (await db.user.findUniqueOrThrow({ where: { id: employeeId } })).role,
    ).toBe("SENIOR_STAFF")
    await page.goto("/admin/houses")
    await page
      .getByRole("button", { name: "Create house", exact: true })
      .click()
    await page.getByLabel("House name", { exact: true }).fill(houseName)
    await page.getByLabel("House code", { exact: true }).fill(`UIH-${suffix}`)
    await page
      .getByLabel("Street address", { exact: true })
      .fill("Fictional New Zealand address")
    await page.getByLabel("Contact phone", { exact: true }).fill("000 111 2222")
    await page.getByLabel("Latitude", { exact: true }).fill("91")
    await page.getByLabel("Longitude", { exact: true }).fill("174.7")
    await page.getByRole("button", { name: "Save house", exact: true }).click()
    await expect(
      page.getByRole("alert").filter({ hasText: "Changes not saved" }),
    ).toContainText("Changes not saved")
    await page.getByLabel("Latitude", { exact: true }).fill("-36.8")
    await page.getByRole("button", { name: "Save house", exact: true }).click()
    await expect(page).toHaveURL(/\/admin\/houses\/[0-9a-f-]+\?saved=1$/)
    houseId = new URL(page.url()).pathname.split("/").at(-1)!
    await page.getByRole("tab", { name: "Clients", exact: true }).click()
    await page
      .getByRole("button", { name: "Create client", exact: true })
      .click()
    await page.getByLabel("First name", { exact: true }).fill("Fictional")
    await page
      .getByLabel("Last name", { exact: true })
      .fill(`Persistent ${suffix}`)
    await page
      .getByLabel("Client reference", { exact: true })
      .fill(`UIC-${suffix}`)
    await page.getByLabel("Date of birth", { exact: true }).fill("2000-01-01")
    await page.getByRole("button", { name: "Add contact", exact: true }).click()
    const contact = page.getByRole("region", { name: "Contact 1", exact: true })
    await contact
      .getByLabel("Full name", { exact: true })
      .fill(`Fictional NOK ${suffix}`)
    await contact.getByLabel("Relationship", { exact: true }).fill("Sibling")
    await contact.getByLabel("Phone", { exact: true }).fill("000 333 4444")
    await contact.getByLabel("Emergency contact", { exact: true }).check()
    await page.getByRole("button", { name: "Save client", exact: true }).click()
    await expect(page).toHaveURL(/\/admin\/clients\/[0-9a-f-]+\?saved=1$/)
    clientId = new URL(page.url()).pathname.split("/").at(-1)!
    await assignments(page, id.staffB, houseName, true)
    await login(staffPage, id.staffB)
    await staffPage.goto("/houses")
    await expect(staffPage.locator(".cm-content")).toContainText(houseName)
    await staffPage.goto(`/search?q=${encodeURIComponent(clientName)}`)
    await expect(staffPage.locator(".cm-result")).toContainText(clientName)
    await staffPage.locator(".cm-result").first().click()
    await staffPage
      .getByRole("link", { name: "View contacts & next of kin" })
      .click()
    await expect(staffPage.getByTestId("contact-card")).toContainText(
      "000 333 4444",
    )
    await page.goto(`/admin/houses/${houseId}/edit`)
    await page.getByLabel("Contact phone", { exact: true }).fill("000 999 8888")
    await page.route(`**/api/admin/houses/${houseId}`, (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "Service unavailable" }),
      }),
    )
    await page.getByRole("button", { name: "Save house", exact: true }).click()
    await expect(
      page.getByRole("alert").filter({ hasText: "Changes not saved" }),
    ).toContainText("Changes not saved")
    expect(
      (await db.house.findUniqueOrThrow({ where: { id: houseId } })).phone,
    ).toBe("000 111 2222")
    await page.unroute(`**/api/admin/houses/${houseId}`)
    await page.getByRole("button", { name: "Save house", exact: true }).click()
    await expect(page).toHaveURL(/\?saved=1$/)
    await staffPage.goto(`/houses/${houseId}`)
    await expect(
      staffPage.getByRole("link", { name: "000 999 8888", exact: true }),
    ).toBeVisible()
    await page.goto(`/admin/clients/${clientId}?tab=contacts`)
    await page
      .getByRole("button", { name: "Edit contacts", exact: true })
      .click()
    const contactsModal = page.getByRole("dialog", {
      name: "Edit contacts / next of kin",
      exact: true,
    })
    await contactsModal
      .getByLabel("Phone", { exact: true })
      .fill("000 555 6666")
    await contactsModal
      .getByRole("button", { name: "Save contacts", exact: true })
      .click()
    await expect(contactsModal).toHaveCount(0)
    await staffPage.goto(`/clients/${clientId}`)
    await expect(staffPage.getByTestId("contact-card")).toContainText(
      "000 555 6666",
    )
    await page
      .getByRole("tab", { name: "House assignment", exact: true })
      .click()
    await page
      .getByRole("button", { name: "Transfer client", exact: true })
      .click()
    const transfer = page.getByRole("dialog", {
      name: "Transfer client to another house",
      exact: true,
    })
    await transfer
      .getByLabel("New house", { exact: true })
      .selectOption(id.houseA)
    await transfer
      .getByRole("button", { name: "Review transfer", exact: true })
      .click()
    await transfer
      .getByRole("button", { name: "Confirm transfer", exact: true })
      .click()
    await expect(transfer).toHaveCount(0)
    expect(
      (await staffPage.request.get(`/api/clients/${clientId}`)).status(),
    ).toBe(404)
    await login(otherPage, id.staffA)
    expect(
      (await otherPage.request.get(`/api/clients/${clientId}`)).status(),
    ).toBe(200)
    await assignments(page, id.staffB, houseName, false)
    expect(
      (await staffPage.request.get(`/api/houses/${houseId}/clients`)).status(),
    ).toBe(404)
    await page.goto(`/admin/employees/${id.staffB}`)
    await page.getByRole("button", { name: "Deactivate", exact: true }).click()
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Confirm status change", exact: true })
      .click()
    await expect(page.getByRole("dialog")).toHaveCount(0)
    expect((await staffPage.request.get("/api/me")).status()).toBe(401)
    const events = await db.auditEvent.findMany({
      where: { targetId: { in: [employeeId, houseId, clientId] } },
    })
    expect(events.map((e) => e.action)).toEqual(
      expect.arrayContaining([
        "employee.created",
        "house.created",
        "client.created",
        "contacts.updated",
        "client.transferred",
      ]),
    )
    expect(JSON.stringify(events.map((e) => e.summary))).not.toContain(
      "000 555 6666",
    )
    await page.screenshot({
      path: "/tmp/caremetrics-2c-admin-1280.png",
      animations: "disabled",
    })
  } finally {
    // Restore seed access and archive only this run's fictional records through the same authorised API.
    const headers = { Origin: "http://localhost:8558" }
    const user = await db.user.findUniqueOrThrow({ where: { id: id.staffB } })
    if (user.status !== "ACTIVE")
      expect(
        (
          await page.request.post(`/api/admin/employees/${user.id}/status`, {
            headers,
            data: {
              status: "ACTIVE",
              expectedUpdatedAt: user.updatedAt.toISOString(),
            },
          })
        ).ok(),
      ).toBe(true)
    const refreshed = await db.user.findUniqueOrThrow({
      where: { id: id.staffB },
    })
    expect(
      (
        await page.request.put(
          `/api/admin/employees/${id.staffB}/assignments`,
          {
            headers,
            data: {
              houseIds: [id.houseB],
              expectedUpdatedAt: refreshed.updatedAt.toISOString(),
            },
          },
        )
      ).ok(),
    ).toBe(true)
    if (clientId) {
      const c = await db.client.findUniqueOrThrow({ where: { id: clientId } })
      expect(
        (
          await page.request.patch(`/api/admin/clients/${clientId}`, {
            headers,
            data: {
              name: c.name,
              preferredName: c.preferredName ?? "",
              reference: c.reference,
              dateOfBirth: c.dateOfBirth?.toISOString().slice(0, 10) ?? "",
              summary: c.summary ?? "",
              houseId: c.houseId,
              active: false,
              expectedUpdatedAt: c.updatedAt.toISOString(),
            },
          })
        ).ok(),
      ).toBe(true)
    }
    if (houseId) {
      const h = await db.house.findUniqueOrThrow({ where: { id: houseId } })
      expect(
        (
          await page.request.patch(`/api/admin/houses/${houseId}`, {
            headers,
            data: {
              name: h.name,
              code: h.code,
              address: h.address,
              phone: h.phone ?? "",
              email: h.email ?? "",
              active: false,
              latitude: h.latitude === null ? null : Number(h.latitude),
              longitude: h.longitude === null ? null : Number(h.longitude),
              expectedUpdatedAt: h.updatedAt.toISOString(),
            },
          })
        ).ok(),
      ).toBe(true)
    }
    await staffContext.close()
    await otherContext.close()
  }
})

test("real mutation endpoints reject Staff, forged roles, cross-site requests and Manager escalation", async ({
  page,
}) => {
  await login(page, id.staffA)
  const before = await db.auditEvent.count()
  const headers = { Origin: "http://localhost:8558" }
  for (const [path, method] of [
    ["/api/admin/employees", "POST"],
    [`/api/admin/employees/${id.staffB}`, "PATCH"],
    [`/api/admin/employees/${id.staffB}/status`, "POST"],
    [`/api/admin/employees/${id.staffB}/assignments`, "PUT"],
    ["/api/admin/houses", "POST"],
    [`/api/admin/houses/${id.houseA}`, "PATCH"],
    ["/api/admin/clients", "POST"],
    [`/api/admin/clients/${id.clientA}`, "PATCH"],
    [`/api/admin/clients/${id.clientA}/contacts`, "PUT"],
    [`/api/admin/clients/${id.clientA}/transfer`, "POST"],
  ])
    expect(
      (
        await page.request.fetch(path, {
          method,
          headers,
          data: {
            role: "ADMINISTRATOR",
            actorId: id.admin,
            organisationId: id.organisation,
          },
        })
      ).status(),
    ).toBe(403)
  expect(
    (
      await page.request.post("/api/admin/houses", {
        headers: { Origin: "https://untrusted.example" },
        data: {},
      })
    ).status(),
  ).toBe(403)
  expect(await db.auditEvent.count()).toBe(before)
  await page.context().clearCookies()
  await login(page, id.manager)
  const user = await db.user.findUniqueOrThrow({ where: { id: id.manager } })
  const response = await page.request.patch(`/api/admin/employees/${user.id}`, {
    headers,
    data: {
      name: user.name,
      employeeCode: user.employeeCode,
      email: user.email,
      role: "ADMINISTRATOR",
      status: "ACTIVE",
      houseIds: [],
      expectedUpdatedAt: user.updatedAt.toISOString(),
    },
  })
  expect(response.status()).toBe(403)
  expect(
    (await db.user.findUniqueOrThrow({ where: { id: user.id } })).role,
  ).toBe("MANAGER")
  expect(await db.auditEvent.count()).toBe(before)
})
