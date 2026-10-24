import { databaseConnection } from "../../src/server/config/database-url"
import { describe, it, expect } from "vitest"
import {
  backendEnvironment,
  isBackendEnabled,
} from "../../src/server/config/backend"
import { isPreviewEnabled } from "../../src/lib/preview"
const configured = {
  NODE_ENV: "development",
  CAREMETRICS_BACKEND_MODE: "database",
  AUTH_SECRET: "x".repeat(48),
  AUTH_URL: "http://localhost:8558",
  DATABASE_URL: "postgresql://localhost/fictional_test",
} as NodeJS.ProcessEnv
describe("backend fail-closed configuration", () => {
  it("requires explicit database mode and complete security configuration", () => {
    expect(isBackendEnabled({})).toBe(false)
    for (const key of [
      "AUTH_SECRET",
      "AUTH_URL",
      "DATABASE_URL",
      "CAREMETRICS_BACKEND_MODE",
    ])
      expect(() =>
        backendEnvironment({ ...configured, [key]: undefined }),
      ).toThrow("Backend unavailable")
    expect(backendEnvironment(configured).origin).toBe("http://localhost:8558")
  })
  it("requires trusted HTTPS origin and verified remote database TLS in production", () => {
    expect(() =>
      backendEnvironment({ ...configured, NODE_ENV: "production" }),
    ).toThrow()
    expect(() =>
      backendEnvironment({
        ...configured,
        AUTH_URL: "https://app.example.test/path",
      }),
    ).toThrow()
    expect(() =>
      backendEnvironment({
        ...configured,
        DATABASE_URL: "postgresql://example.test/database?sslmode=disable",
      }),
    ).toThrow()
    expect(
      backendEnvironment({
        ...configured,
        NODE_ENV: "production",
        AUTH_URL: "https://app.example.test",
        DATABASE_URL: "postgresql://example.test/database?sslmode=verify-full",
      }).origin,
    ).toBe("https://app.example.test")
  })
  it("never enables development preview in real backend mode or production", () => {
    expect(
      isPreviewEnabled({ ...configured, CAREMETRICS_UI_PREVIEW: "true" }),
    ).toBe(false)
    expect(
      isPreviewEnabled({
        NODE_ENV: "production",
        CAREMETRICS_UI_PREVIEW: "true",
      }),
    ).toBe(false)
  })
})

it("supports pulled Neon names and requires direct migration endpoints", () => {
  const pooled =
    "postgresql://example-pooler.region.aws.neon.tech/database?sslmode=require"
  expect(new URL(databaseConnection(pooled)).searchParams.get("sslmode")).toBe(
    "verify-full",
  )
  expect(() => databaseConnection(pooled, true)).toThrow(
    "Direct database connection required",
  )
})
