// Format authored files only: Prisma output is regenerated and must not be reformatted.
import { execFileSync, spawnSync } from "node:child_process"
const files = execFileSync(
  "git",
  [
    "ls-files",
    "--cached",
    "--others",
    "--exclude-standard",
    "-z",
    "--",
    "src",
    "tests",
    "scripts",
    "prisma",
    "prisma.config.ts",
    "neon.ts",
    "next.config.ts",
    "vitest.config.ts",
    "vitest.backend.config.ts",
    "playwright.config.ts",
    "playwright.firefox.config.ts",
    "playwright.admin.config.ts",
    "playwright.backend.config.ts",
    "eslint.config.mjs",
    "postcss.config.mjs",
  ],
  { encoding: "utf8" },
)
  .split("\0")
  .filter((p) => /\.[cm]?[jt]sx?$/.test(p))
const result = spawnSync(
  "pnpm",
  ["exec", "oxfmt", ...process.argv.slice(2), ...files],
  { stdio: "inherit" },
)
process.exit(result.status ?? 1)
