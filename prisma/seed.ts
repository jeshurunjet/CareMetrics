import { config } from "dotenv"
import { databaseConnection } from "../src/server/config/database-url"
config({ path: [".env.local", ".env"], quiet: true })
import { readFile, stat } from "node:fs/promises"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"
import { hashPassword } from "../src/server/auth/password"
import { seedIds as id, seedEmployees } from "./seed-data"

async function seed() {
  if (
    process.env.NEON_BRANCH_NAME === "production" ||
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production" ||
    process.env.CAREMETRICS_SEED_CONFIRM !== "fictional-development-only"
  )
    throw new Error("Fictional seed is disabled")
  const rawUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DIRECT_URL
  const connectionString = rawUrl ? databaseConnection(rawUrl, true) : undefined
  if (
    !connectionString ||
    !process.env.CAREMETRICS_SEED_DATABASE_NAME ||
    new URL(connectionString).pathname.slice(1) !==
      process.env.CAREMETRICS_SEED_DATABASE_NAME
  )
    throw new Error("Explicit isolated database confirmation required")
  let credentials: Record<string, string> = {}
  const file = process.env.CAREMETRICS_SEED_CREDENTIALS_FILE
  if (file) {
    const info = await stat(file)
    if (!info.isFile() || (info.mode & 0o077) !== 0)
      throw new Error("Credentials file must be private (0600)")
    const value: unknown = JSON.parse(await readFile(file, "utf8"))
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error("Invalid provisioning file")
    credentials = (value as Record<string, string>)
    if (
      Object.keys(credentials).some(
        (email) => !seedEmployees.some((e) => e.email === email),
      )
    )
      throw new Error("Unknown fictional account")
    const passwords = Object.values(credentials)
    if (
      passwords.some(
        (p) => typeof p !== "string" || p.length < 16 || p.length > 128,
      ) ||
      new Set(passwords).size !== passwords.length
    )
      throw new Error("Distinct generated passwords required")
  }
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
  try {
    const hashes = new Map<string, string>()
    for (const e of seedEmployees)
      if (credentials[e.email])
        hashes.set(e.id, await hashPassword(credentials[e.email]))
    await db.$transaction(
      async (tx) => {
        const collision = await tx.user.findFirst({
          where: {
            email: { in: seedEmployees.map((e) => e.email) },
            NOT: { organisationId: id.organisation },
          },
          select: { id: true },
        })
        if (collision)
          throw new Error("Fictional account collision; refusing seed")
        await tx.organisation.upsert({
          where: { id: id.organisation },
          create: {
            id: id.organisation,
            name: "CareMetrics Fictional Development",
          },
          update: {},
        })
        for (const [i, e] of seedEmployees.entries())
          await tx.user.upsert({
            where: { id: e.id },
            create: {
              ...e,
              organisationId: id.organisation,
              employeeCode: `DEV-${i + 1}`,
              status: hashes.has(e.id) ? "ACTIVE" : "INVITED",
              passwordHash: hashes.get(e.id) ?? null,
            },
            update: {},
          })
        for (const [houseId, code, name] of [
          [id.houseA, "FICTION-A", "Harbour Example House"],
          [id.houseB, "FICTION-B", "Meadow Sample House"],
        ])
          await tx.house.upsert({
            where: { id: houseId },
            create: {
              id: houseId,
              organisationId: id.organisation,
              code,
              name,
              address: "Fictional address, New Zealand",
            },
            update: {},
          })
        for (const [employeeId, houseId] of [
          [id.staffA, id.houseA],
          [id.staffB, id.houseB],
          [id.senior, id.houseA],
          [id.senior, id.houseB],
        ])
          await tx.employeeHouseAssignment.upsert({
            where: {
              organisationId_employeeId_houseId: {
                organisationId: id.organisation,
                employeeId,
                houseId,
              },
            },
            create: { organisationId: id.organisation, employeeId, houseId },
            update: {},
          })
        for (const [clientId, houseId, name] of [
          [id.clientA, id.houseA, "Sam Example"],
          [id.clientB, id.houseB, "Lee Sample"],
          [id.clientC, id.houseA, "Drew Fiction"],
        ]) {
          await tx.client.upsert({
            where: { id: clientId },
            create: {
              id: clientId,
              organisationId: id.organisation,
              houseId,
              reference: `DEV-${clientId.slice(-2)}`,
              name,
              summary: "Fictional profile for backend testing only.",
            },
            update: {},
          })
          const contactId = clientId.replace(/3([123])$/, "6$1")
          await tx.clientContact.upsert({
            where: { id: contactId },
            create: {
              id: contactId,
              organisationId: id.organisation,
              clientId,
              name: "Fictional NOK",
              relationship: "Example relative",
              isPrimary: true,
              phone: "000 000 0000",
            },
            update: {},
          })
        }
        await tx.careTemplate.upsert({
          where: { id: id.template },
          create: {
            id: id.template,
            organisationId: id.organisation,
            name: "Fictional wellbeing observation",
          },
          update: {},
        })
        if (
          !(await tx.careTemplateVersion.findUnique({
            where: { id: id.version },
            select: { id: true },
          }))
        )
          await tx.careTemplateVersion.create({
            data: {
              id: id.version,
              organisationId: id.organisation,
              templateId: id.template,
              version: 1,
              definition: {
                version: 1,
                published: true,
                name: "Fictional wellbeing observation",
                sections: [
                  {
                    id: "observation",
                    title: "Observation",
                    fields: [
                      {
                        id: "notes",
                        type: "textarea",
                        label: "Observation notes",
                        required: true,
                      },
                    ],
                  },
                ],
              },
            },
          })
        await tx.clientTemplateAssignment.upsert({
          where: {
            organisationId_clientId_templateId: {
              organisationId: id.organisation,
              clientId: id.clientA,
              templateId: id.template,
            },
          },
          create: {
            organisationId: id.organisation,
            clientId: id.clientA,
            templateId: id.template,
            version: 1,
          },
          update: {},
        })
        for (const [shiftId, employeeId, houseId] of [
          [id.shiftA, id.staffA, id.houseA],
          [id.shiftB, id.staffB, id.houseB],
        ])
          await tx.shift.upsert({
            where: { id: shiftId },
            create: {
              id: shiftId,
              organisationId: id.organisation,
              employeeId,
              houseId,
              startsAt: new Date("2026-10-26T19:00:00Z"),
              endsAt: new Date("2026-10-27T03:00:00Z"),
            },
            update: {},
          })
      },
      { timeout: 15000 },
    )
    console.log(
      "Fictional seed completed; existing records and passwords were preserved.",
    )
  } finally {
    await db.$disconnect()
  }
}
seed().catch(() => {
  console.error(
    "Seed failed. Check isolated database and provisioning configuration; no secrets logged.",
  )
  process.exitCode = 1
})
