import { test, expect, type Page } from "@playwright/test"
import { readFile } from "node:fs/promises"
import { randomUUID } from "node:crypto"
import { PrismaClient } from "../../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { seedIds as id, seedEmployees } from "../../prisma/seed-data"
import { addDays, nzDay } from "../../src/modules/staff/roster/dates"
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
test("scheduling HTTP rejects anonymous and Staff mutations and forged schedule scope", async ({
  page,
}) => {
  expect((await page.request.get("/api/shifts")).status()).toBe(401)
  await login(page, id.staffA)
  const headers = { Origin: "http://localhost:8558" }
  for (const [url, method] of [
    ["/api/admin/shifts", "POST"],
    [`/api/admin/shifts/${id.shiftA}`, "PATCH"],
    [`/api/admin/shifts/${id.shiftA}/cancel`, "POST"],
  ]) {
    const response = await page.request.fetch(url, {
      method,
      headers,
      data: {},
    })
    expect(response.status()).toBe(403)
  }
  expect(
    (await page.request.get(`/api/shifts?employee=${id.staffB}`)).status(),
  ).toBe(400)
  expect((await page.request.get(`/api/shifts/${id.shiftB}`)).status()).toBe(
    404,
  )
  expect(
    (await page.request.get(`/api/shifts?house=${id.houseB}`)).status(),
  ).toBe(404)
  expect((await page.request.get(`/api/shifts?month=2026-13`)).status()).toBe(
    400,
  )
  expect(
    (
      await page.request.get(`/api/shifts?day=2026-10-25&day=2026-10-26`)
    ).status(),
  ).toBe(400)
})
test("scheduling Admin create edit cancel persists and appears in mobile Staff My Shifts Roster Dashboard", async ({
  page,
  browser,
}, info) => {
  test.skip(
    (info.project.use.viewport?.width ?? 1280) < 1024,
    "Admin UI is desktop only; scheduling HTTP checks run at all widths.",
  )
  test.setTimeout(120000)
  const day = addDays(nzDay(new Date().toISOString()), 4),
    note = `Fictional scheduling ${randomUUID().slice(0, 8)}`
  let shiftId: string | undefined
  await login(page, id.admin)
  const context = await browser.newContext({
    viewport: { width: 390, height: 900 },
    baseURL: "http://localhost:8558",
  })
  const staff = await context.newPage()
  try {
    await page.goto(
      `/admin/roster?tab=shifts&day=${day}&month=${day.slice(0, 7)}`,
    )
    await page
      .getByRole("button", { name: "Create shift", exact: true })
      .click()
    await page
      .getByRole("dialog", { name: "Create shift", exact: true })
      .getByLabel("Employee", { exact: true })
      .selectOption(id.staffA)
    await page
      .getByRole("dialog", { name: "Create shift", exact: true })
      .getByLabel("House", { exact: true })
      .selectOption(id.houseA)
    await page.getByLabel("Shift date", { exact: true }).fill(day)
    await page.getByLabel("Start", { exact: true }).fill("08:00")
    await page.getByLabel("End", { exact: true }).fill("12:00")
    await page.getByLabel("Notes", { exact: true }).fill(note)
    await page
      .getByRole("button", { name: "Publish shift", exact: true })
      .click()
    await expect(page).toHaveURL(/shiftId=[0-9a-f-]+/)
    shiftId = new URL(page.url()).searchParams.get("shiftId")!
    await expect(page.getByText(shiftId, { exact: true })).toBeVisible()
    await expect(page.getByText(note, { exact: true })).toBeVisible()
    expect(
      (await db.shift.findUniqueOrThrow({ where: { id: shiftId } }))
        .assignedById,
    ).toBe(id.admin)
    await page.goto(
      `/admin/roster?tab=calendar&day=${day}&month=${day.slice(0, 7)}`,
    )
    const block = page
      .locator(".ad-shift-block")
      .filter({ hasText: "08:00 – 12:00" })
    await expect(block).toBeVisible()
    await page.getByLabel("Employee", { exact: true }).selectOption(id.staffB)
    await expect(block).toHaveCount(0)
    await page.getByLabel("Employee", { exact: true }).selectOption(id.staffA)
    await page.getByLabel("House", { exact: true }).selectOption(id.houseB)
    await expect(block).toHaveCount(0)
    await page.getByLabel("House", { exact: true }).selectOption(id.houseA)
    await page.getByRole("button", { name: "Day", exact: true }).click()
    await expect(block).toBeVisible()
    await page.getByRole("button", { name: "Month", exact: true }).click()
    await expect(page.locator(".ad-month-cell")).toHaveCount(42)
    await page.getByRole("button", { name: "Week", exact: true }).click()
    await block.click()
    await expect(
      page.getByRole("dialog").getByText(shiftId, { exact: true }),
    ).toBeVisible()
    await page
      .getByRole("dialog")
      .evaluate((e) =>
        Promise.all(e.getAnimations({ subtree: true }).map((a) => a.finished)),
      )
    await page.screenshot({ path: "/tmp/cm2d-admin-1280.png" })
    await login(staff, id.staffA)
    await expect(staff.locator(`[data-shift-id="${shiftId}"]`)).toBeVisible()
    await expect(
      staff.getByRole("button", { name: "Clock in unavailable", exact: true }),
    ).toBeDisabled()
    await expect(
      staff.getByRole("link", { name: "Continue to dashboard", exact: true }),
    ).toBeVisible()
    await staff.locator(`[data-shift-id="${shiftId}"]`).click()
    await expect(
      staff.getByRole("dialog").getByText(shiftId, { exact: true }),
    ).toBeVisible()
    await expect(
      staff.getByRole("dialog").getByText(note, { exact: true }),
    ).toBeVisible()
    await staff
      .getByRole("dialog")
      .evaluate((e) =>
        Promise.all(e.getAnimations({ subtree: true }).map((a) => a.finished)),
      )
    await staff.screenshot({ path: "/tmp/cm2d-staff-390.png" })
    await staff.getByRole("button", { name: "Open house", exact: true }).click()
    await expect(staff).toHaveURL(new RegExp(`/houses/${id.houseA}$`))
    await staff.goto("/dashboard")
    await staff.locator(`[data-shift-id="${shiftId}"]`).click()
    await expect(staff).toHaveURL(new RegExp(`/roster\\?shiftId=${shiftId}`))
    await expect(
      staff.getByRole("dialog").getByText(shiftId, { exact: true }),
    ).toBeVisible()
    await page.getByRole("button", { name: "Edit shift", exact: true }).click()
    await page.getByLabel("Notes", { exact: true }).fill(`${note} edited`)
    await page.getByLabel("End", { exact: true }).fill("13:00")
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click()
    await expect(
      page.getByRole("dialog", { name: "Edit shift", exact: true }),
    ).toHaveCount(0)
    await expect(
      page.getByText("Shift changes saved.", { exact: true }),
    ).toBeVisible()
    await expect(
      page.getByRole("dialog").getByText(`${note} edited`, { exact: true }),
    ).toBeVisible()
    await staff.reload({ waitUntil: "domcontentloaded" })
    await expect(
      staff.getByRole("dialog").getByText(`${note} edited`, { exact: true }),
    ).toBeVisible()
    await page
      .getByRole("dialog", { name: "Shift details", exact: true })
      .getByRole("button", { name: "Cancel shift", exact: true })
      .click()
    await page
      .getByRole("dialog", { name: "Cancel this shift?", exact: true })
      .getByRole("button", { name: "Cancel shift", exact: true })
      .click()
    await expect
      .poll(
        async () =>
          (await db.shift.findUniqueOrThrow({ where: { id: shiftId! } }))
            .status,
      )
      .toBe("CANCELLED")
    await staff.reload({ waitUntil: "domcontentloaded" })
    await expect(
      staff.getByRole("dialog").getByText("Cancelled", { exact: true }),
    ).toBeVisible()
    await expect(
      staff
        .getByRole("dialog")
        .getByRole("button", { name: "Clock in unavailable", exact: true }),
    ).toBeDisabled()
    const events = await db.auditEvent.findMany({
      where: { targetId: shiftId },
      orderBy: { createdAt: "asc" },
    })
    expect(events.map((e) => e.action)).toEqual([
      "shift.created",
      "shift.updated",
      "shift.cancelled",
    ])
  } finally {
    if (shiftId) {
      const row = await db.shift.findUnique({ where: { id: shiftId } })
      if (row?.status === "SCHEDULED") {
        const response = await page.request.post(
          `/api/admin/shifts/${shiftId}/cancel`,
          {
            headers: { Origin: "http://localhost:8558" },
            data: {
              confirmed: true,
              expectedUpdatedAt: row.updatedAt.toISOString(),
            },
          },
        )
        expect(response.ok()).toBeTruthy()
      }
    }
    await context.close()
  }
})
