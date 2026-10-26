// Operator-only fictional staging acceptance. No server route imports this script.
import assert from "node:assert/strict"
import { readFile, writeFile, stat } from "node:fs/promises"
import { dirname, join } from "node:path"
import { randomUUID, createHmac } from "node:crypto"
import { setTimeout as delay } from "node:timers/promises"
import { chromium, expect } from "@playwright/test"
import { encode, decode } from "next-auth/jwt"
import { parse } from "dotenv"
import pg from "pg"
import { seedIds as id } from "../prisma/seed-data.ts"

const targetPath = process.argv[2]
const finishAdmin = process.argv.includes("--resume-admin-logout")
if (finishAdmin && !process.argv.includes("--resume"))
  throw new Error("Resume required")
if (
  !targetPath ||
  !process.argv.includes("--allow-writes") ||
  process.env.CAREMETRICS_STAGING_ACCEPTANCE_ACK !== "fictional-staging-only"
)
  throw new Error(
    "Explicit private staging target and fictional acceptance acknowledgement required",
  )
const root = dirname(targetPath)
for (const file of [
  targetPath,
  join(root, "runtime.env"),
  join(root, "maintenance.env"),
  join(root, "demo-credentials.json"),
])
  assert.equal(
    (await stat(file)).mode & 0o077,
    0,
    "Owner-only operator files required",
  )
const target = JSON.parse(await readFile(targetPath, "utf8"))
assert.equal(target.projectId, "twilight-credit-01101322")
assert.equal(target.branchId, "br-plain-paper-a70wmny8")
assert.equal(target.branchName, "staging")
assert.equal(target.origin, "https://caremetrics-staging.vercel.app")
const runtime = parse(await readFile(join(root, "runtime.env")))
const maintenance = parse(await readFile(join(root, "maintenance.env")))
const credentials = JSON.parse(
  await readFile(join(root, "demo-credentials.json"), "utf8"),
)
const origin = target.origin
const db = new pg.Client({
  connectionString: maintenance.DATABASE_URL_UNPOOLED,
})
const secrets = [
  runtime.AUTH_SECRET,
  runtime.DATABASE_URL,
  maintenance.DATABASE_URL_UNPOOLED,
  new URL(runtime.DATABASE_URL).password,
  ...Object.values(credentials),
]
const report = {
  origin,
  projectId: target.projectId,
  branchId: target.branchId,
  startedAt: new Date().toISOString(),
  checks: [],
  records: {},
  physicalAndroid: "not tested",
  attendanceSuccess: "blocked by unapproved production policy",
}
if (process.argv.includes("--resume")) {
  const previous = JSON.parse(
    await readFile(join(root, "hosted-acceptance.json"), "utf8"),
  )
  assert.equal(previous.origin, origin)
  assert.equal(previous.projectId, target.projectId)
  Object.assign(report.records, previous.records)
  report.resumedChecks = previous.checks
  report.resumedFrom = previous.startedAt
  if (finishAdmin) {
    assert.equal(
      previous.failedStep,
      "deferred mutations fail closed, logout/revocation and zero offline caches",
    )
    assert.ok(
      previous.checks.includes(
        "committed Diary, Care exact-version history and fresh-session reads",
      ),
    )
    const error = await readFile(
      join(root, "hosted-acceptance-error.txt"),
      "utf8",
    )
    assert.ok(
      error.includes("strict mode violation") && error.includes("Sign out"),
      "Only the known Admin selector interruption may be resumed here",
    )
    report.checks = [...previous.checks]
    report.resumeNote =
      "Previous run completed Staff deferred mutation, offline/reconnect/logout/copied-cookie assertions and failed only at the final Admin Sign out selector; this run verifies Admin logout and final audits."
  }
}
let browser,
  staffContext,
  adminContext,
  step = "initialisation"
function pass(label) {
  report.checks.push(label)
  console.log(`PASS ${label}`)
}
async function phase(label, run) {
  step = label
  await run()
  pass(label)
}
async function login(page, email) {
  const key = createHmac("sha256", runtime.AUTH_SECRET)
    .update(`login:${email}`)
    .digest("hex")
  const bucket = (
    await db.query(
      'SELECT attempts,"expiresAt" FROM "LoginAttempt" WHERE key=$1',
      [key],
    )
  ).rows[0]
  if (bucket?.attempts >= 5) {
    while (Date.now() <= new Date(bucket.expiresAt).getTime()) {
      console.log(
        "Waiting for existing login throttle expiry; controls unchanged.",
      )
      await delay(
        Math.min(
          30000,
          new Date(bucket.expiresAt).getTime() - Date.now() + 1000,
        ),
      )
    }
  }
  await page.goto(`${origin}/login`)
  await page.getByRole("button", { name: "Show password", exact: true }).click()
  await page.getByRole("button", { name: "Hide password", exact: true }).click()
  await page.getByLabel("Email address", { exact: true }).fill(email)
  await page.getByLabel("Password", { exact: true }).fill(credentials[email])
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  await expect(page).toHaveURL(`${origin}/shift-check`, { timeout: 30000 })
}
async function logout(page) {
  const menu = page.getByRole("button", { name: "Menu", exact: true })
  const out = page
    .getByRole("button", { name: "Sign out", exact: true })
    .first()
  await expect
    .poll(async () => (await menu.isVisible()) || (await out.isVisible()))
    .toBe(true)
  if (await menu.isVisible()) await menu.click()
  await out.click()
  await expect(page).toHaveURL(`${origin}/login`)
}
async function privateResponse(response, status) {
  assert.equal(response.status(), status)
  assert.match(response.headers()["cache-control"], /no-store/)
}
try {
  await db.connect()
  assert.equal(db.connection.stream.authorized, true)
  const {
    rows: [identity],
  } = await db.query(
    "SELECT current_database() AS database,current_user AS role",
  )
  assert.equal(identity.database, "caremetrics_staging")
  assert.equal(identity.role, "caremetrics_staging_owner")
  assert.equal(
    (
      await db.query(
        'SELECT count(*)::int AS n FROM "Organisation" WHERE id=$1 AND name=$2',
        [id.organisation, "CareMetrics Fictional Development"],
      )
    ).rows[0].n,
    1,
  )
  browser = await chromium.launch({ headless: true })
  staffContext = await browser.newContext({
    viewport: { width: 390, height: 900 },
  })
  adminContext = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  })
  const staff = await staffContext.newPage(),
    admin = await adminContext.newPage()
  for (const page of [staff, admin]) {
    page.setDefaultTimeout(20000)
    page.setDefaultNavigationTimeout(30000)
  }
  if (!finishAdmin) {
    await phase("public HTTPS metadata and anonymous denial", async () => {
      const manifest = await staff.request.get(`${origin}/manifest.webmanifest`)
      assert.equal(manifest.status(), 200)
      assert.deepEqual(
        [(await manifest.json()).start_url, (await manifest.json()).scope],
        ["/", "/"],
      )
      await privateResponse(await staff.request.get(`${origin}/api/me`), 401)
      const csrf = await staff.request.post(
        `${origin}/api/auth/callback/credentials`,
        {
          headers: { Origin: "https://untrusted.example" },
          form: { email: "invalid", password: "invalid" },
        },
      )
      assert.equal(csrf.status(), 403)
    })
    await phase(
      "real Staff login, Secure cookies and exact staging identity",
      async () => {
        await login(staff, "robin.staff@caremetrics.example.test")
        const me = await staff.request.get(`${origin}/api/me`)
        await privateResponse(me, 200)
        assert.equal((await me.json()).id, id.staffA)
        const cookie = (await staffContext.cookies()).find((c) =>
          c.name.includes("authjs.session-token"),
        )
        assert.ok(
          cookie?.secure && cookie.httpOnly && cookie.sameSite === "Lax",
        )
        secrets.push(cookie.value)
        const claims = await decode({
          token: cookie.value,
          secret: runtime.AUTH_SECRET,
          salt: cookie.name,
        })
        const row = (
          await db.query('SELECT "sessionVersion" FROM "User" WHERE id=$1', [
            id.staffA,
          ])
        ).rows[0]
        assert.equal(claims.sub, id.staffA)
        assert.equal(claims.sessionVersion, row.sessionVersion)
        const expired = await encode({
          secret: runtime.AUTH_SECRET,
          salt: cookie.name,
          token: { sub: id.staffA, sessionVersion: row.sessionVersion },
          maxAge: -3600,
        })
        secrets.push(expired)
        await privateResponse(
          await staff.request.get(`${origin}/api/me`, {
            headers: { Cookie: `${cookie.name}=${expired}` },
          }),
          401,
        )
        await staff.goto(origin)
        await expect(staff).toHaveURL(`${origin}/shift-check`)
        await staff
          .getByRole("link", { name: "Continue to dashboard", exact: true })
          .click()
        await expect(staff).toHaveURL(`${origin}/dashboard`)
        await staff.reload()
      },
    )
    await phase(
      "server scope, management denial and production attendance lockout",
      async () => {
        await privateResponse(
          await staff.request.get(`${origin}/api/clients/${id.clientB}`),
          404,
        )
        await privateResponse(
          await staff.request.get(`${origin}/api/houses/${id.houseB}/clients`),
          404,
        )
        await privateResponse(
          await staff.request.get(`${origin}/api/admin/foundation`),
          403,
        )
        assert.equal(
          (
            await staff.request.post(`${origin}/api/admin/employees`, {
              headers: { Origin: origin },
              data: { role: "ADMINISTRATOR", name: "forged" },
            })
          ).status(),
          403,
        )
        const state = await (
          await staff.request.get(
            `${origin}/api/attendance/clock-in?shiftId=${id.shiftA}`,
          )
        ).json()
        assert.equal(state.available, false)
        assert.equal(state.code, "POLICY_UNAVAILABLE")
        const attempt = await staff.request.post(
          `${origin}/api/attendance/clock-in`,
          {
            headers: { Origin: origin },
            data: {
              shiftId: id.shiftA,
              requestId: randomUUID(),
              latitude: 0,
              longitude: 0,
              accuracyMetres: 1,
              measuredAt: Date.now(),
            },
          },
        )
        assert.equal(attempt.status(), 503)
        assert.equal((await attempt.json()).code, "POLICY_UNAVAILABLE")
        assert.equal(
          (await db.query('SELECT count(*)::int AS n FROM "AttendanceRecord"'))
            .rows[0].n,
          0,
        )
      },
    )
    let suffix = randomUUID().slice(0, 8)
    if (report.records.house) {
      const row = (
        await db.query(
          'SELECT name FROM "House" WHERE id=$1 AND "organisationId"=$2',
          [report.records.house, id.organisation],
        )
      ).rows[0]
      assert.ok(row)
      suffix = row.name.split(" ").at(-1)
      assert.match(suffix, /^[a-f0-9]{8}$/)
    }
    const houseName = `Fictional HTTPS House ${suffix}`,
      clientName = `Fictional HTTPS ${suffix}`
    await phase(
      "Admin employee/house/client/NOK writes and shared Staff assignment",
      async () => {
        await login(admin, "avery.admin@caremetrics.example.test")
        await admin.goto(origin)
        await expect(admin).toHaveURL(`${origin}/admin/dashboard`)
        if (!report.records.employee) {
          await admin.goto(`${origin}/admin/employees/new`)
          await admin
            .getByLabel("First name", { exact: true })
            .fill("Fictional")
          await admin
            .getByLabel("Last name", { exact: true })
            .fill(`HTTPS ${suffix}`)
          await admin
            .getByLabel("Employee ID", { exact: true })
            .fill(`STG-E-${suffix}`)
          await admin
            .getByLabel("Work email", { exact: true })
            .fill(`hosted-${suffix}@caremetrics.example.test`)
          await admin
            .getByRole("button", { name: "Create employee", exact: true })
            .click()
          await expect(admin).toHaveURL(
            /\/admin\/employees\/[a-f0-9-]+\?saved=1$/,
          )
          report.records.employee = new URL(admin.url()).pathname
            .split("/")
            .at(-1)
          const employee = (
            await db.query(
              'SELECT status,"passwordHash" FROM "User" WHERE id=$1',
              [report.records.employee],
            )
          ).rows[0]
          assert.equal(employee.status, "INVITED")
          assert.equal(employee.passwordHash, null)
        }
        if (!report.records.house) {
          await admin.goto(`${origin}/admin/houses/new`)
          await admin.getByLabel("House name", { exact: true }).fill(houseName)
          await admin
            .getByLabel("House code", { exact: true })
            .fill(`STG-H-${suffix}`)
          await admin
            .getByLabel("Street address", { exact: true })
            .fill("Fictional New Zealand address")
          await admin
            .getByRole("button", { name: "Save house", exact: true })
            .click()
          await expect(admin).toHaveURL(/\/admin\/houses\/[a-f0-9-]+\?saved=1$/)
          report.records.house = new URL(admin.url()).pathname.split("/").at(-1)
          await admin.goto(
            `${origin}/admin/houses/${report.records.house}/edit`,
          )
          await admin
            .getByLabel("Contact phone", { exact: true })
            .fill("000 111 2222")
          await admin
            .getByRole("button", { name: "Save house", exact: true })
            .click()
          await expect(admin).toHaveURL(/saved=1$/)
        }
        if (!report.records.client) {
          await admin.goto(
            `${origin}/admin/clients/new?house=${report.records.house}`,
          )
          await admin
            .getByLabel("First name", { exact: true })
            .fill("Fictional")
          await admin
            .getByLabel("Last name", { exact: true })
            .fill(`HTTPS ${suffix}`)
          await admin
            .getByLabel("Client reference", { exact: true })
            .fill(`STG-C-${suffix}`)
          await admin
            .getByLabel("Date of birth", { exact: true })
            .fill("2000-01-01")
          const houseField = admin.getByLabel("House", { exact: true })
          if (await houseField.count())
            await houseField.selectOption(report.records.house)
          await admin
            .getByRole("button", { name: "Add contact", exact: true })
            .click()
          const contact = admin.getByRole("region", {
            name: "Contact 1",
            exact: true,
          })
          await contact
            .getByLabel("Full name", { exact: true })
            .fill("Fictional staging NOK")
          await contact
            .getByLabel("Relationship", { exact: true })
            .fill("Sibling")
          await contact
            .getByLabel("Phone", { exact: true })
            .fill("000 333 4444")
          await admin
            .getByRole("button", { name: "Save client", exact: true })
            .click()
          await expect(admin).toHaveURL(
            /\/admin\/clients\/[a-f0-9-]+\?saved=1$/,
          )
          report.records.client = new URL(admin.url()).pathname
            .split("/")
            .at(-1)
        }
        await admin.goto(`${origin}/admin/employees/${id.staffA}?tab=houses`)
        await admin
          .getByRole("button", { name: "Assign houses", exact: true })
          .click()
        const modal = admin.getByRole("dialog", { name: /Assign houses/ })
        await modal
          .getByRole("checkbox", { name: new RegExp(houseName) })
          .check()
        await modal
          .getByRole("button", { name: "Save changes", exact: true })
          .click()
        await expect(modal).toHaveCount(0)
        await staff.goto(`${origin}/houses`)
        await expect(staff.locator(".cm-content")).toContainText(houseName)
        await staff.goto(`${origin}/search?q=${encodeURIComponent(clientName)}`)
        await expect(staff.locator(".cm-result").first()).toContainText(
          clientName,
        )
        await staff.locator(".cm-result").first().click()
        await staff.getByRole("link", { name: /View contacts/ }).click()
        await expect(staff.getByTestId("contact-card")).toContainText(
          "000 333 4444",
        )
      },
    )
    await phase("Admin scheduling appears in Staff My Shifts", async () => {
      const parts = new Intl.DateTimeFormat("en", {
        timeZone: "Pacific/Auckland",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(new Date())
      const p = Object.fromEntries(parts.map((x) => [x.type, x.value]))
      const day = new Date(
        Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day) + 1),
      )
        .toISOString()
        .slice(0, 10)
      if (!report.records.shift) {
        await admin.goto(
          `${origin}/admin/roster?tab=shifts&day=${day}&month=${day.slice(0, 7)}`,
        )
        await admin
          .getByRole("button", { name: "Create shift", exact: true })
          .click()
        const modal = admin.getByRole("dialog", {
          name: "Create shift",
          exact: true,
        })
        await modal
          .getByLabel("Employee", { exact: true })
          .selectOption(id.staffA)
        await modal
          .getByLabel("House", { exact: true })
          .selectOption(report.records.house)
        await admin.getByLabel("Shift date", { exact: true }).fill(day)
        await admin.getByLabel("Start", { exact: true }).fill("10:00")
        await admin.getByLabel("End", { exact: true }).fill("12:00")
        await admin
          .getByLabel("Notes", { exact: true })
          .fill("Fictional HTTPS scheduling acceptance")
        await admin
          .getByRole("button", { name: "Publish shift", exact: true })
          .click()
        await expect(admin).toHaveURL(/shiftId=[a-f0-9-]+/)
        report.records.shift = new URL(admin.url()).searchParams.get("shiftId")
      }
      const shift = (
        await db.query(
          'SELECT "assignedById","employeeId","houseId" FROM "Shift" WHERE id=$1',
          [report.records.shift],
        )
      ).rows[0]
      assert.equal(shift.assignedById, id.admin)
      assert.equal(shift.employeeId, id.staffA)
      await staff.goto(`${origin}/shift-check`)
      await expect(staff.locator(".cm-content")).toContainText(houseName)
      await admin.goto(`${origin}/admin/roster?tab=attendance`)
      await expect(admin.locator(".ad-content")).toBeVisible()
    })
    await phase(
      "committed Diary, Care exact-version history and fresh-session reads",
      async () => {
        if (!report.records.diary) {
          await staff.goto(`${origin}/clients/${id.clientA}/diary/new`)
          await staff
            .getByLabel("Entry title", { exact: true })
            .fill(`Fictional HTTPS acceptance ${suffix}`)
          await staff
            .getByLabel("Category", { exact: true })
            .selectOption("progress-notes")
          await staff
            .getByLabel("Diary entry", { exact: true })
            .fill("Fictional HTTPS staging note; no real care information.")
          await staff
            .getByLabel("Reason for off-shift documentation", { exact: true })
            .fill("Fictional demonstration outside recorded attendance")
          await staff
            .getByRole("button", { name: "Submit entry", exact: true })
            .click()
          await expect(staff).toHaveURL(/tab=diary&item=[a-f0-9-]+$/)
          report.records.diary = new URL(staff.url()).searchParams.get("item")
        }
        await staff.goto(
          `${origin}/clients/${id.clientA}?tab=diary&item=${report.records.diary}`,
        )
        await expect(staff.locator(".cm-content")).toContainText(
          `Fictional HTTPS acceptance ${suffix}`,
        )
        if (!report.records.care) {
          await staff.goto(
            `${origin}/clients/${id.clientA}/records/new?templateId=${id.template}`,
          )
          await staff
            .getByLabel("Observation notes", { exact: true })
            .fill(
              "Fictional HTTPS version-one assessment; no real care information.",
            )
          await staff
            .getByLabel("Reason for off-shift documentation", { exact: true })
            .fill("Fictional demonstration outside recorded attendance")
          await staff
            .getByRole("button", { name: "Submit assessment", exact: true })
            .click()
          await expect(staff).toHaveURL(
            /tab=care&sub=[a-f0-9-]+&item=[a-f0-9-]+$/,
          )
          report.records.care = new URL(staff.url()).searchParams.get("item")
        }
        await staff.goto(
          `${origin}/clients/${id.clientA}?tab=care&sub=${id.template}&item=${report.records.care}`,
        )
        const care = (
          await db.query(
            'SELECT "templateId","templateVersion","authorId",values FROM "CareRecord" WHERE id=$1',
            [report.records.care],
          )
        ).rows[0]
        assert.equal(care.templateId, id.template)
        assert.equal(care.templateVersion, 1)
        assert.equal(care.authorId, id.staffA)
        assert.ok(
          care.values.notes ===
            "Fictional HTTPS version-one assessment; no real care information.",
          "Original answer integrity",
        )
        const api = await staff.request.get(
          `${origin}/api/clients/${id.clientA}/care-records/${report.records.care}`,
        )
        await privateResponse(api, 200)
        await privateResponse(
          await staff.request.get(
            `${origin}/api/clients/${report.records.client}/care-records/${report.records.care}`,
          ),
          404,
        )
        await privateResponse(
          await staff.request.get(
            `${origin}/api/clients/${report.records.client}/diary/${report.records.diary}`,
          ),
          404,
        )
        await admin.goto(
          `${origin}/admin/clients/${id.clientA}?tab=care&sub=${id.template}&item=${report.records.care}`,
        )
        await expect(admin.locator(".ad-content")).toContainText(
          "Fictional wellbeing observation",
        )
        await admin.goto(
          `${origin}/admin/clients/${id.clientA}?tab=diary&item=${report.records.diary}`,
        )
        await expect(admin.locator(".ad-content")).toContainText(
          `Fictional HTTPS acceptance ${suffix}`,
        )
        // Preserve completed fresh-login/revocation evidence when resuming a later step.
        if (
          !report.resumedChecks?.includes(
            "committed Diary, Care exact-version history and fresh-session reads",
          )
        ) {
          const fresh = await browser.newContext({
            viewport: { width: 390, height: 900 },
          })
          try {
            const page = await fresh.newPage()
            await login(page, "robin.staff@caremetrics.example.test")
            await page.goto(
              `${origin}/clients/${id.clientA}?tab=care&sub=${id.template}&item=${report.records.care}`,
            )
            await expect(page.locator(".cm-content")).toContainText(
              "Fictional HTTPS version-one assessment",
            )
            await logout(page)
          } finally {
            await fresh.close()
          }
          // Logout revokes every session for that employee; the previous context must now fail too.
          await privateResponse(
            await staff.request.get(`${origin}/api/me`),
            401,
          )
        }
      },
    )
    await phase(
      "deferred mutations fail closed, logout/revocation and zero offline caches",
      async () => {
        await login(staff, "robin.staff@caremetrics.example.test")
        for (const path of [
          "/leave",
          "/notifications",
          `/clients/${id.clientA}?tab=charting`,
        ]) {
          await staff.goto(origin + path)
          await expect(
            staff.getByText(
              "This feature is not available in the current CareMetrics version.",
              { exact: true },
            ),
          ).toBeVisible()
        }
        const before = (
          await db.query('SELECT count(*)::int AS n FROM "AuditEvent"')
        ).rows[0].n
        for (const path of [
          "/api/leave",
          "/api/files",
          "/api/admin/documentation/templates",
          "/api/admin/documentation/corrections",
        ]) {
          const response = await staff.request.post(origin + path, {
            headers: { Origin: origin },
            data: { preview: true, role: "ADMINISTRATOR" },
            maxRedirects: 0,
          })
          console.log(
            `PROBE ${path} ${response.status()} location=${response.headers().location || "none"} type=${response.headers()["content-type"] || "none"}`,
          )
          assert.ok(
            response.status() >= 400,
            `Deferred ${path} status=${response.status()}`,
          )
        }
        assert.equal(
          (await db.query('SELECT count(*)::int AS n FROM "AuditEvent"'))
            .rows[0].n,
          before,
        )
        assert.equal(await staff.evaluate(() => window.isSecureContext), true)
        assert.equal(
          await staff.evaluate(
            async () =>
              (await navigator.serviceWorker.getRegistrations()).length,
          ),
          0,
        )
        assert.deepEqual(await staff.evaluate(() => caches.keys()), [])
        await staff.goto(`${origin}/clients/${id.clientA}`)
        await staffContext.setOffline(true)
        await expect(
          staff.getByRole("heading", { name: "Connection unavailable" }),
        ).toBeVisible()
        await staffContext.setOffline(false)
        await expect(staff.locator(".cm-app")).toBeVisible()
        const old = (await staffContext.cookies()).find((c) =>
          c.name.includes("authjs.session-token"),
        )
        secrets.push(old.value)
        await logout(staff)
        await privateResponse(
          await staff.request.get(`${origin}/api/me`, {
            headers: { Cookie: `${old.name}=${old.value}` },
          }),
          401,
        )
        await staffContext.setOffline(true)
        await staff.goBack({ waitUntil: "domcontentloaded" }).catch(() => null)
        await expect(staff.locator(".cm-app")).toBeHidden()
        await staffContext.setOffline(false)
        await admin.goto(`${origin}/admin/dashboard`)
        await logout(admin)
      },
    )
  } else {
    await phase(
      "final Admin logout after resumed Staff security assertions",
      async () => {
        await login(admin, "avery.admin@caremetrics.example.test")
        await admin.goto(`${origin}/admin/dashboard`)
        await logout(admin)
        await privateResponse(await admin.request.get(`${origin}/api/me`), 401)
      },
    )
  }
  await phase(
    "persisted audit and retained attendance safeguards",
    async () => {
      for (const [record, action] of [
        [report.records.diary, "diary.submitted"],
        [report.records.care, "care.submitted"],
      ]) {
        const { rows } = await db.query(
          'SELECT "actorId",summary FROM "AuditEvent" WHERE "targetId"=$1 AND action=$2',
          [record, action],
        )
        assert.equal(rows.length, 1)
        assert.equal(rows[0].actorId, id.staffA)
        assert.ok(
          !JSON.stringify(rows[0].summary).includes("Fictional HTTPS"),
          "No care text in audit",
        )
      }
      assert.equal(
        (await db.query('SELECT count(*)::int AS n FROM "AttendanceRecord"'))
          .rows[0].n,
        0,
      )
    },
  )
  report.completedAt = new Date().toISOString()
  report.passed = true
} catch (error) {
  report.passed = false
  report.failedStep = step
  let detail = String(error.stack || error)
  for (const value of secrets)
    if (value) detail = detail.split(value).join("[REDACTED]")
  await writeFile(join(root, "hosted-acceptance-error.txt"), detail, {
    mode: 0o600,
  })
  console.error(
    `Hosted acceptance failed at: ${step}; private redacted diagnostics saved.`,
  )
  process.exitCode = 1
} finally {
  await writeFile(
    join(root, "hosted-acceptance.json"),
    JSON.stringify(report, null, 2) + "\n",
    { mode: 0o600 },
  )
  await browser?.close()
  await db.end()
}
