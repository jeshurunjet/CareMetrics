// Maintenance only. Default dry-run; never imported by application code or builds.
import assert from "node:assert/strict"
import { readFile, stat } from "node:fs/promises"
import { join, dirname } from "node:path"
import pg from "pg"
import { parse } from "dotenv"
import { runDemoPolish } from "./lib/demo-polish.ts"
const targetPath = process.argv[2],
  apply = process.argv.includes("--apply")
if (
  !targetPath ||
  (apply &&
    process.env.CAREMETRICS_DEMO_POLISH_ACK !==
      "approved-fictional-staging-polish")
)
  throw Error("Private target file and explicit apply acknowledgement required")
const root = dirname(targetPath),
  maintenance = join(root, "maintenance.env")
for (const file of [targetPath, maintenance])
  assert.equal(
    (await stat(file)).mode & 0o077,
    0,
    "Owner-only maintenance files required",
  )
const target = JSON.parse(await readFile(targetPath, "utf8"))
assert.equal(target.projectId, "twilight-credit-01101322")
assert.equal(target.branchId, "br-plain-paper-a70wmny8")
assert.equal(target.branchName, "staging")
assert.equal(target.origin, "https://caremetrics-staging.vercel.app")
const env = parse(await readFile(maintenance)),
  url = new URL(env.DATABASE_URL_UNPOOLED ?? "")
assert.equal(
  url.hostname,
  "ep-silent-scene-a79j4tw3.ap-southeast-2.aws.neon.tech",
)
assert.equal(url.pathname, "/caremetrics_staging")
assert.ok(
  ["verify-full", "verify-ca"].includes(url.searchParams.get("sslmode")),
)
const db = new pg.Client({ connectionString: url.toString() })
try {
  await db.connect()
  const report = await runDemoPolish(db, apply)
  console.log(
    JSON.stringify(
      {
        ...report,
        target: { project: target.projectId, branch: target.branchId },
        organisationClassification:
          "fictional-demo (explicit operator-only marker)",
      },
      null,
      2,
    ),
  )
} catch {
  console.error(
    "Demo polish stopped; no partial changes committed. Check exact target, migration and record guards privately.",
  )
  process.exitCode = 1
} finally {
  await db.end()
}
