import { it, expect } from "vitest"
import pg from "pg"
import { database } from "../../src/server/db"
import {
  demoPolishPlan as plan,
  demoOrganisationId as org,
} from "../../prisma/demo-polish-plan"
import { runDemoPolish } from "../../scripts/lib/demo-polish"
it("exact fictional polish dry-run, repeat apply and protected records remain byte-identical; unexpected names fail closed", async () => {
  if (process.env.NEON_BRANCH_NAME !== "local-test")
    throw Error("Disposable database required")
  const db = database(),
    client = new pg.Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  try {
    // Rehearse the four Admin-created fictional records in the known staging plan.
    const h = plan.find((p) => p.table === "House" && p.id.startsWith("64d8"))!
    await db.house.create({
      data: {
        id: h.id,
        organisationId: org,
        code: h.guard,
        name: h.from,
        address: "Fictional address",
      },
    })
    const u = plan.find((p) => p.table === "User" && p.id.startsWith("6bcf"))!
    await db.user.create({
      data: {
        id: u.id,
        organisationId: org,
        employeeCode: "STG-E-F8B96D28",
        email: u.guard,
        name: u.from,
        role: "STAFF",
        status: "INVITED",
      },
    })
    const c = plan.find((p) => p.table === "Client" && p.id.startsWith("616b"))!
    await db.client.create({
      data: {
        id: c.id,
        organisationId: org,
        reference: c.guard,
        name: c.from,
        houseId: h.id,
      },
    })
    const k = plan.find(
      (p) => p.table === "ClientContact" && p.id.startsWith("720f"),
    )!
    await db.clientContact.create({
      data: {
        id: k.id,
        organisationId: org,
        clientId: c.id,
        name: k.from,
        relationship: "Relative",
      },
    })
    const before = await db.user.findUniqueOrThrow({ where: { id: u.id } })
    const dry = await runDemoPolish(client)
    expect(dry.mode).toBe("dry-run")
    expect(dry.changes).toHaveLength(17)
    expect(await db.user.findUniqueOrThrow({ where: { id: u.id } })).toEqual(
      before,
    )
    const applied = await runDemoPolish(client, true)
    expect(applied.preservation).toEqual(dry.preservation)
    const after = await db.user.findUniqueOrThrow({ where: { id: u.id } })
    expect(after).toEqual({ ...before, name: u.to })
    const second = await runDemoPolish(client, true)
    expect(second.changes.every((p) => p.alreadyApplied)).toBe(true)
    expect(second.preservation).toEqual(dry.preservation)
    await client.query('UPDATE "User" SET name=$1 WHERE id=$2', [
      "Unexpected identity",
      u.id,
    ])
    await expect(runDemoPolish(client, true)).rejects.toThrow(
      "Unexpected current name",
    )
    await client.query('UPDATE "User" SET name=$1 WHERE id=$2', [u.to, u.id])
  } finally {
    // Remove only these four disposable, unreferenced presentation fixtures.
    await db.clientContact.deleteMany({
      where: { id: "720f53ad-41d2-4bd1-9a89-c6e3eea833dc" },
    })
    await db.client.deleteMany({
      where: { id: "616b4acf-942f-4c30-a539-15982b7514d1" },
    })
    await db.user.deleteMany({
      where: { id: "6bcf3717-8003-42ea-90f4-f6a8beaf6fb9" },
    })
    await db.house.deleteMany({
      where: { id: "64d8c9bc-b0cb-4af0-9c8e-9dbdb41009b7" },
    })
    await client.end()
    await db.$disconnect()
  }
})
