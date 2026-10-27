import { it, expect, vi, afterEach } from "vitest"
vi.mock("server-only", () => ({}))
const purge = vi.hoisted(() =>
  vi.fn(async () => ({ purged: 2, check: "purged-check" })),
)
vi.mock("../../src/server/attendance/retention-job", () => ({
  runLocationRetention: purge,
}))
import { GET } from "../../src/app/api/jobs/purge-location-evidence/route"
afterEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})
it("requires strong server secret in Authorization, never query parameters", async () => {
  vi.stubEnv("CRON_SECRET", "x".repeat(48))
  for (const request of [
    new Request("https://example.test/api/jobs/purge-location-evidence"),
    new Request(
      "https://example.test/api/jobs/purge-location-evidence?secret=" +
        "x".repeat(48),
    ),
    new Request("https://example.test/api/jobs/purge-location-evidence", {
      headers: { authorization: "Bearer wrong" },
    }),
  ]) {
    const response = await GET(request)
    expect(response.status).toBe(401)
    expect(response.headers.get("cache-control")).toContain("no-store")
  }
  expect(purge).not.toHaveBeenCalled()
  const response = await GET(
    new Request("https://example.test/api/jobs/purge-location-evidence", {
      headers: {
        authorization: "Bearer " + "x".repeat(48),
        "x-caremetrics-retention-refresh": "1",
      },
    }),
  )
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({ purged: 2 })
})
it("fails closed with missing secret or private database failure", async () => {
  vi.stubEnv("CRON_SECRET", "")
  expect((await GET(new Request("https://example.test/job"))).status).toBe(401)
  vi.stubEnv("CRON_SECRET", "x".repeat(48))
  purge.mockRejectedValueOnce(new Error("private database information"))
  const response = await GET(
    new Request("https://example.test/job", {
      headers: {
        authorization: "Bearer " + "x".repeat(48),
        "x-caremetrics-retention-refresh": "1",
      },
    }),
  )
  expect(response.status).toBe(503)
  expect(await response.text()).not.toContain("private database")
})

it("scheduler deliveries require both the cleanup secret and a valid QStash body/URL/time signature", async () => {
  const { createHmac, createHash } = await import("node:crypto")
  const current = "test-only-signature-".repeat(3),
    next = "rotated-test-signature-".repeat(3),
    origin =
      "https://caremetrics-staging.vercel.app/api/jobs/purge-location-evidence",
    now = Math.floor(Date.now() / 1000)
  vi.stubEnv("CRON_SECRET", "x".repeat(48))
  vi.stubEnv("QSTASH_CURRENT_SIGNING_KEY", current)
  vi.stubEnv("QSTASH_NEXT_SIGNING_KEY", next)
  function sign(secret: string, patch: Record<string, unknown> = {}) {
    const header = Buffer.from(
        JSON.stringify({ alg: "HS256", typ: "JWT" }),
      ).toString("base64url"),
      payload = Buffer.from(
        JSON.stringify({
          iss: "Upstash",
          sub: origin,
          iat: now,
          nbf: now - 1,
          exp: now + 60,
          body: createHash("sha256").update("").digest("base64url"),
          ...patch,
        }),
      ).toString("base64url"),
      data = header + "." + payload
    return (
      data + "." + createHmac("sha256", secret).update(data).digest("base64url")
    )
  }
  for (const signature of [
    sign("wrong"),
    sign(current, { sub: "https://untrusted.test/" }),
    sign(current, { exp: now - 10 }),
    sign(current, { body: "wrong" }),
    "invalid",
  ]) {
    expect(
      (
        await GET(
          new Request(origin, {
            headers: {
              authorization: "Bearer " + "x".repeat(48),
              "upstash-signature": signature,
            },
          }),
        )
      ).status,
    ).toBe(401)
  }
  expect(purge).not.toHaveBeenCalled()
  expect(
    (
      await GET(
        new Request(origin, {
          headers: { authorization: "Bearer " + "x".repeat(48) },
        }),
      )
    ).status,
  ).toBe(401)
  for (const secret of [current, next]) {
    expect(
      (
        await GET(
          new Request(origin, {
            headers: {
              authorization: "Bearer " + "x".repeat(48),
              "upstash-signature": sign(secret),
            },
          }),
        )
      ).status,
    ).toBe(200)
  }
  expect(purge).toHaveBeenCalledWith(false)
})
