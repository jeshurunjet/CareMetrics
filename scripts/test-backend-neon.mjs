// Mutates fictional accounts only: never run against a production branch.
import { config } from "dotenv"
import { spawn } from "node:child_process"
import { readFile } from "node:fs/promises"
config({ path: [".env.local", ".env"], quiet: true })
if (
  process.env.NODE_ENV === "production" ||
  process.env.VERCEL_ENV === "production" ||
  process.env.NEON_BRANCH_NAME !== "phase-2a" ||
  process.env.CAREMETRICS_SEED_CONFIRM !== "fictional-development-only" ||
  !process.env.CAREMETRICS_SEED_CREDENTIALS_FILE
) {
  console.error(
    "An explicitly confirmed fictional phase-2a development branch is required.",
  )
  process.exit(1)
}
// Never applied to the normal app environment; this policy covers only fictional test records.
process.env.CAREMETRICS_GPS_TEST_POLICY_ACK = "fictional-development-only"
process.env.CAREMETRICS_GPS_POLICIES = JSON.stringify([
  JSON.parse(
    await readFile(
      new URL("../tests/fixtures/gps-policy.json", import.meta.url),
      "utf8",
    ),
  ),
])
const child = spawn(
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
  {
    env: {
      ...process.env,
      NODE_ENV: "development",
      CAREMETRICS_BACKEND_MODE: "database",
      AUTH_URL: "http://localhost:8558",
    },
    stdio: "inherit",
  },
)
child.once("error", () => {
  console.error("Neon backend checks unavailable")
  process.exitCode = 1
})
child.once("exit", (code) => {
  process.exitCode = code ?? 1
})
