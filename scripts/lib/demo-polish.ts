import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import type { Client } from "pg"
import {
  demoPolishPlan as plan,
  demoOrganisationId as org,
} from "../../prisma/demo-polish-plan"
const guardColumns = {
  User: "email",
  House: "code",
  Client: "reference",
  ClientContact: "clientId",
}
const tables = [
  "Organisation",
  "User",
  "House",
  "Client",
  "ClientContact",
  "EmployeeHouseAssignment",
  "Shift",
  "AttendanceRecord",
  "AttendanceLocationEvidence",
  "ClientDiaryEntry",
  "CareTemplate",
  "CareTemplateVersion",
  "ClientTemplateAssignment",
  "CareRecord",
  "AuditEvent",
  "LoginAttempt",
]
function digest(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex")
}
interface PreservationHash {
  count: number
  protectedSha256: string
}
async function snapshot(db: Client) {
  const result: Record<string, PreservationHash> = {}
  for (const table of tables) {
    const rows = (
      await db.query(`SELECT to_jsonb(t) AS value FROM public."${table}" t`)
    ).rows.map((r) => r.value)
    // Exclude only the exact authorised presentation fields of the exact known rows.
    for (const row of rows) {
      if (table === "Organisation" && row.id === org) delete row.isFictionalDemo
      if (plan.some((p) => p.table === table && p.id === row.id)) {
        delete row.name
        if (table === "House") delete row.imageKey
      }
    }
    result[table] = {
      count: rows.length,
      protectedSha256: digest(rows.map((row) => JSON.stringify(row)).sort()),
    }
  }
  return result
}

export async function runDemoPolish(db: Client, apply = false) {
  try {
    await db.query(
      "BEGIN ISOLATION LEVEL SERIALIZABLE" + (apply ? "" : " READ ONLY"),
    )
    assert.equal(
      (
        await db.query(
          'SELECT name FROM "Organisation" WHERE id=$1 AND active=TRUE',
          [org],
        )
      ).rows[0]?.name,
      "CareMetrics Fictional Development",
    )
    const current = []
    for (const p of plan) {
      const column = guardColumns[p.table]
      const row = (
        await db.query(
          `SELECT * FROM public."${p.table}" WHERE id=$1 AND "organisationId"=$2`,
          [p.id, org],
        )
      ).rows[0]
      assert.ok(row, "Expected exact fictional record missing")
      assert.equal(
        row[column],
        p.guard,
        "Record identity changed; review required",
      )
      assert.ok(
        [p.from, p.to].includes(row.name),
        "Unexpected current name; review required",
      )
      if (p.table === "House")
        assert.ok(
          [null, p.imageKey].includes(row.imageKey),
          "Unexpected image mapping",
        )
      current.push({
        table: p.table,
        id: p.id,
        from: row.name,
        to: p.to,
        ...("imageKey" in p ? { imageKey: p.imageKey } : {}),
        alreadyApplied:
          row.name === p.to &&
          (!("imageKey" in p) || row.imageKey === p.imageKey),
      })
    }
    const before = await snapshot(db)
    if (apply) {
      await db.query('SELECT id FROM "Organisation" WHERE id=$1 FOR UPDATE', [
        org,
      ])
      await db.query(
        'UPDATE "Organisation" SET "isFictionalDemo"=TRUE WHERE id=$1',
        [org],
      )
      for (const p of plan) {
        if ("imageKey" in p)
          await db.query(
            `UPDATE public."House" SET name=$1,"imageKey"=$2 WHERE id=$3 AND "organisationId"=$4`,
            [p.to, p.imageKey, p.id, org],
          )
        else
          await db.query(
            `UPDATE public."${p.table}" SET name=$1 WHERE id=$2 AND "organisationId"=$3`,
            [p.to, p.id, org],
          )
      }
      assert.deepEqual(
        await snapshot(db),
        before,
        "Protected data changed; rollback required",
      )
      await db.query("COMMIT")
    } else await db.query("ROLLBACK")

    return {
      mode: apply ? "applied" : "dry-run",
      changes: current,
      preservation: before,
    }
  } catch (error) {
    await db.query("ROLLBACK")
    throw error
  }
}
