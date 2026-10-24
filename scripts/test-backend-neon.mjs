// Mutates fictional accounts only: never run against a production branch.
import { config } from "dotenv"
import { spawn } from "node:child_process"
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
const child = spawn(
  "pnpm",
  ["exec", "playwright", "test", "--config=playwright.backend.config.ts"],
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
