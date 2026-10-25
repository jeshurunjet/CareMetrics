import { describe, expect, it } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import manifest from "../../src/app/manifest"
import config from "../../next.config"
import { backendEnvironment } from "../../src/server/config/backend"

describe("online-only mobile launch contract", () => {
  it("uses one stable identity, origin scope, brand and safe public icons", () => {
    const data = manifest()
    expect(data).toMatchObject({
      id: "/",
      start_url: "/",
      scope: "/",
      display: "standalone",
      name: "CareMetrics",
      theme_color: "#1a6b7a",
      background_color: "#f4f6f9",
      prefer_related_applications: false,
    })
    expect(data.icons).toHaveLength(4)
    for (const icon of data.icons!) {
      const bytes = readFileSync(`public${icon.src}`)
      expect(bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a")
      const size = Number(icon.sizes!.split("x")[0])
      expect(bytes.readUInt32BE(16)).toBe(size)
      expect(bytes.readUInt32BE(20)).toBe(size)
      expect([192, 512]).toContain(size)
      expect(["any", "maskable"]).toContain(icon.purpose)
    }
  })
  it("adds no service worker, background sync or public private-data cache", async () => {
    expect(readdirSync("public")).not.toContain("sw.js")
    const headers = await config.headers!()
    const global = headers.find((entry) => entry.source === "/:path*")!.headers
    expect(global).toEqual(
      expect.arrayContaining([
        { key: "Cache-Control", value: "private, no-store" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "X-Frame-Options", value: "DENY" },
      ]),
    )
  })
  it("requires a trusted HTTPS production origin without credentials, tokens or paths", () => {
    const env = {
      NODE_ENV: "production",
      CAREMETRICS_BACKEND_MODE: "database",
      AUTH_SECRET: "x".repeat(48),
      AUTH_URL: "https://caremetrics.example.test",
      DATABASE_URL: "postgresql://fictional:fictional@localhost/test",
    }
    expect(backendEnvironment(env).origin).toBe(env.AUTH_URL)
    for (const flags of [
      { NEON_BRANCH_NAME: "phase-2a" },
      { NEON_BRANCH_NAME: "local-test" },
      { CAREMETRICS_SEED_CONFIRM: "fictional-development-only" },
      { CAREMETRICS_SEED_CREDENTIALS_FILE: "/private/example.json" },
      { CAREMETRICS_GPS_TEST_POLICY_ACK: "fictional-development-only" },
      { CAREMETRICS_CLOCK_OUT_TEST_POLICY_ACK: "fictional-development-only" },
    ])
      expect(() => backendEnvironment({ ...env, ...flags })).toThrow()
    for (const origin of [
      "http://localhost:8443",
      "https://caremetrics.example.test/login",
      "https://caremetrics.example.test?session=unsafe",
      "https://user:pass@caremetrics.example.test",
    ])
      expect(() => backendEnvironment({ ...env, AUTH_URL: origin })).toThrow()
  })
})
