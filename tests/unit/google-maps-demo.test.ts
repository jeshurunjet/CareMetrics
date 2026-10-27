import { describe, it, expect, vi } from "vitest"
vi.mock("server-only", () => ({}))
import {
  assessDemoReference,
  demoLocationNotice,
  GLENFIELD_DEMO_REFERENCE as reference,
} from "../../src/modules/attendance/demo-reference"
import { googleMapsDemoConfiguration } from "../../src/server/config/google-maps-demo"
const id = "20000000-0000-4000-8000-000000000001",
  key = "AIza" + "t".repeat(35)
const env = {
  NODE_ENV: "test",
  DATABASE_URL: "postgresql://test:test@localhost/caremetrics_google_test",
  AUTH_URL: "http://localhost:8558",
  NEON_BRANCH_NAME: "local-test",
  CAREMETRICS_DEPLOYMENT_KIND: "fictional-demo",
  CAREMETRICS_DEMO_DATA_ACK: "fictional-records-only",
  CAREMETRICS_DEMO_ORGANISATION_ID: id,
  CAREMETRICS_GOOGLE_MAPS_DEMO_ACK: "no-billing-evaluation-only",
  GOOGLE_MAPS_DEMO_BROWSER_KEY: key,
}
const point = (accuracyMetres = 3) => ({
  latitude: reference.latitude,
  longitude: reference.longitude,
  accuracyMetres,
  measuredAt: 1800000000000,
})
describe("Google demo scope", () => {
  it("exposes only the browser SDK key in the explicitly acknowledged fictional environment", () => {
    expect(googleMapsDemoConfiguration(id, true, env)).toEqual({
      browserKey: key,
      reference,
    })
  })
  it.each([
    { CAREMETRICS_GOOGLE_MAPS_DEMO_ACK: "" },
    { GOOGLE_MAPS_DEMO_BROWSER_KEY: "" },
    { CAREMETRICS_DEMO_DATA_ACK: "" },
    { NODE_ENV: "production" },
    { CAREMETRICS_DEMO_ORGANISATION_ID: "other" },
  ])("fails closed for missing or ordinary configuration %j", (patch) => {
    expect(
      googleMapsDemoConfiguration(id, true, { ...env, ...patch }),
    ).toBeUndefined()
  })
  it("does not enable for real/unrelated organisations", () => {
    expect(googleMapsDemoConfiguration(id, false, env)).toBeUndefined()
    expect(googleMapsDemoConfiguration("another", true, env)).toBeUndefined()
  })
})
describe("advisory 10m reference, never a clock-in gate", () => {
  it("distinguishes reported inside, outside and accuracy uncertainty", () => {
    expect(assessDemoReference(point(), reference)?.status).toBe("within")
    expect(assessDemoReference(point(20), reference)?.status).toBe("uncertain")
    const p = { ...point(), latitude: reference.latitude + 0.001 }
    expect(assessDemoReference(p, reference)?.status).toBe("outside")
    expect(demoLocationNotice(p, reference)?.message).toContain(
      "accepted for demonstration only",
    )
  })
  it("returns only a transient classification/message, not employee coordinates or distance history", () => {
    const notice = demoLocationNotice(point(), reference)
    expect(Object.keys(notice!).sort()).toEqual([
      "message",
      "referenceLabel",
      "status",
    ])
    expect(reference.proposedRadiusMetres).toBe(10)
  })
  it("rejects invalid coordinates/accuracy without manufacturing an outside claim", () => {
    expect(
      assessDemoReference({ ...point(), latitude: NaN }, reference),
    ).toBeNull()
    expect(assessDemoReference(point(-1), reference)).toBeNull()
  })
})
