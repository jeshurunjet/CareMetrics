import { defineConfig } from "@playwright/test"
import { hasUiReference } from "./tests/reference-availability"
export default defineConfig({
  testDir: "tests/e2e",
  use: { baseURL: "http://localhost:8555", trace: "retain-on-failure" },
  workers: 2,
  projects: [375, 390, 768, 1280, 1440].map((width) => ({
    name: `width-${width}`,
    use: {
      browserName: "chromium",
      viewport: { width, height: 900 },
      deviceScaleFactor: 1,
    },
  })),
  webServer: [
    {
      command: "pnpm exec next dev -p 8555",
      url: "http://localhost:8555/login",
      env: {
        CAREMETRICS_UI_PREVIEW: "true",
        CAREMETRICS_DEMO_NOW: "2026-10-22T01:00:00.000Z",
        NEXT_BUILD_DIR: ".next-e2e",
      },
      reuseExistingServer: false,
      timeout: 120000,
    },
    ...(hasUiReference
      ? [
          {
            command: "node scripts/ui-reference-server.mjs",
            url: "http://localhost:8557",
            reuseExistingServer: false,
            timeout: 120000,
          },
        ]
      : []),
  ],
})
