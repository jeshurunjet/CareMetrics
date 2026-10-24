import { defineConfig } from "@playwright/test"
import base from "./playwright.config"
export default defineConfig({
  ...base,
  testMatch:
    /admin-(core|visual|workforce|workforce-visual|documentation|documentation-visual|record-review|record-review-visual|governance|governance-visual)\.spec\.ts/,
  outputDir: "test-results-admin",
  projects: [375, 390, 768, 1280, 1440, 1600].map((width) => ({
    name: `width-${width}`,
    use: {
      browserName: "chromium",
      viewport: { width, height: 900 },
      deviceScaleFactor: 1,
    },
  })),
})
