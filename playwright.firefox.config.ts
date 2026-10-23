import { defineConfig } from "@playwright/test"
import base from "./playwright.config"
/** Representative smoke coverage; not full Firefox/real-device certification. */
export default defineConfig({
  ...base,
  outputDir: "test-results-firefox",
  testMatch: "profile-integration.spec.ts",
  grep: /profile allowlist|staff photo|settings is Coming Soon|core Staff journey/,
  projects: [
    {
      name: "firefox-desktop",
      use: {
        browserName: "firefox",
        viewport: { width: 1280, height: 900 },
        timezoneId: "Pacific/Auckland",
      },
    },
  ],
})
