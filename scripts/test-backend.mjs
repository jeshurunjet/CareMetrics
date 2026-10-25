// Creates and destroys ONLY its own temporary localhost cluster. No existing database is touched.
import { mkdtemp, writeFile, rm, readFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { randomBytes } from "node:crypto"
import { createServer } from "node:net"
import { spawn } from "node:child_process"
const folder = await mkdtemp(join(tmpdir(), "caremetrics-2a-postgres-"))
const socket = createServer()
await new Promise((r) => socket.listen(0, "127.0.0.1", r))
const port = socket.address().port
await new Promise((r) => socket.close(r))
const password = randomBytes(32).toString("base64url")
const passwordFile = join(folder, "postgres-password")
await writeFile(passwordFile, password, { mode: 0o600 })
const credentialsFile = join(folder, "fictional-credentials.json")
const emails = [
  "avery.admin",
  "morgan.manager",
  "robin.staff",
  "casey.staff",
  "alex.senior",
].map((x) => `${x}@caremetrics.example.test`)
await writeFile(
  credentialsFile,
  JSON.stringify(
    Object.fromEntries(
      emails.map((email) => [email, randomBytes(32).toString("base64url")]),
    ),
  ),
  { mode: 0o600 },
)
const env = {
  ...process.env,
  NODE_ENV: "test",
  DATABASE_URL: `postgresql://caremetrics_test:${password}@127.0.0.1:${port}/caremetrics_phase2a_test`,
  CAREMETRICS_BACKEND_MODE: "database",
  CAREMETRICS_UI_PREVIEW: "false",
  AUTH_SECRET: randomBytes(48).toString("base64url"),
  AUTH_URL: "http://localhost:8558",
  CAREMETRICS_SEED_CONFIRM: "fictional-development-only",
  CAREMETRICS_SEED_DATABASE_NAME: "caremetrics_phase2a_test",
  CAREMETRICS_SEED_CREDENTIALS_FILE: credentialsFile,
}
env.DIRECT_URL = env.DATABASE_URL
env.DATABASE_URL_UNPOOLED = env.DATABASE_URL
env.NEON_BRANCH_NAME = "local-test"
// Explicit test-only GPS policy covers a separate fictional browser-test organisation.
env.CAREMETRICS_GPS_TEST_POLICY_ACK = "fictional-development-only"
env.CAREMETRICS_GPS_POLICIES = JSON.stringify([
  JSON.parse(
    await readFile(
      new URL("../tests/fixtures/gps-policy.json", import.meta.url),
      "utf8",
    ),
  ),
])
async function run(command, args, overrides = {}) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: { ...env, ...overrides },
      stdio: "inherit",
    })
    child.once("error", reject)
    child.once("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error("Backend check command failed")),
    )
  })
}
let started = false
try {
  await run("initdb", [
    "-D",
    join(folder, "data"),
    "-U",
    "caremetrics_test",
    "--pwfile",
    passwordFile,
    "--auth-host=scram-sha-256",
    "--auth-local=trust",
    "--no-locale",
  ])
  await run("pg_ctl", [
    "-D",
    join(folder, "data"),
    "-l",
    join(folder, "postgres.log"),
    "-o",
    `-p ${port} -h 127.0.0.1 -k ${folder}`,
    "-w",
    "start",
  ])
  started = true
  await run(
    "createdb",
    [
      "-h",
      "127.0.0.1",
      "-p",
      String(port),
      "-U",
      "caremetrics_test",
      "caremetrics_phase2a_test",
    ],
    { PGPASSWORD: password },
  )
  await run("pnpm", ["db:migrate"])
  await run("pnpm", ["db:seed"])
  await run("pnpm", ["db:seed"])
  await run("pnpm", ["test:backend"])
  if (process.env.CAREMETRICS_TEST_SERVICES_ONLY !== "true")
    await run(
      "pnpm",
      [
        "exec",
        "playwright",
        "test",
        "--config=playwright.backend.config.ts",
        ...(process.env.CAREMETRICS_BACKEND_TEST_GREP
          ? ["--grep", process.env.CAREMETRICS_BACKEND_TEST_GREP]
          : []),
        ...(process.env.CAREMETRICS_BACKEND_TEST_PROJECT
          ? ["--project", process.env.CAREMETRICS_BACKEND_TEST_PROJECT]
          : []),
      ],
      { NODE_ENV: "development" },
    )
  console.log(
    process.env.CAREMETRICS_TEST_SERVICES_ONLY === "true"
      ? "Isolated PostgreSQL migration, repeat seed and backend service checks passed; browser checks intentionally not run."
      : "Isolated PostgreSQL migration, repeat seed, backend services and real-auth browser checks passed.",
  )
} catch {
  console.error("Backend verification failed; see sanitised check output.")
  process.exitCode = 1
} finally {
  if (started)
    await run("pg_ctl", [
      "-D",
      join(folder, "data"),
      "-m",
      "fast",
      "-w",
      "stop",
    ])
  await rm(folder, { recursive: true, force: true })
}
