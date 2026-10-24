import { defineConfig } from "@playwright/test"
export default defineConfig({
  testDir: "tests/backend-e2e",
  outputDir: "test-results-backend",
  workers: 1,
  use: {
    baseURL: "http://localhost:8558",
    trace: "off",
    screenshot: "off",
    video: "off",
  },
  projects: [375, 1280].map((width) => ({
    name: `backend-${width}`,
    use: { browserName: "chromium", viewport: { width, height: 900 } },
  })),
  webServer: {
    command: "pnpm exec next dev -p 8558",
    url: "http://localhost:8558/login",
    env: {
      CAREMETRICS_BACKEND_MODE: "database",
      CAREMETRICS_UI_PREVIEW: "true",
      NEXT_BUILD_DIR: ".next-backend",
      AUTH_URL: "http://localhost:8558",
    },
    reuseExistingServer: false,
    timeout: 120000,
  },
})
