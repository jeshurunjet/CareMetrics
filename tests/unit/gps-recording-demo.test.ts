import { describe, it, expect, vi } from "vitest"
vi.mock("server-only", () => ({}))
import { demoEnvironment, demoPolicy } from "../fixtures/demo-policy"
import {
  demoAttendancePolicy,
  GPS_RECORDING_DEMO,
} from "../../src/server/attendance/demo-policy"
import {
  demoDeployment,
  DEMO_TARGET,
} from "../../src/server/config/demo-deployment"
const org = DEMO_TARGET.organisationId
const local = {
  ...demoEnvironment(org),
  NODE_ENV: "test",
  NEON_BRANCH_NAME: "local-test",
  DATABASE_URL: "postgresql://operator:unused@localhost/caremetrics_demo_test",
  AUTH_URL: "http://localhost:8558",
}
describe("Fictional demo deployment and explicit policy boundaries", () => {
  it("accepts only the dedicated local test target or pinned hosted fictional project", () => {
    expect(demoAttendancePolicy(org, local)?.mode).toBe(GPS_RECORDING_DEMO)
    expect(demoDeployment({ ...local, NODE_ENV: "production" })).toBe(false)
    const hosted = {
      ...local,
      NODE_ENV: "production",
      VERCEL: "1",
      VERCEL_ENV: "production",
      VERCEL_PROJECT_ID: DEMO_TARGET.vercelProjectId,
      NEON_BRANCH_NAME: "staging",
      AUTH_URL: DEMO_TARGET.origin,
      DATABASE_URL: `postgresql://operator:unused@${DEMO_TARGET.databaseHost}/${DEMO_TARGET.databaseName}?sslmode=verify-full`,
    }
    expect(demoDeployment(hosted)).toBe(true)
    for (const patch of [
      { VERCEL_PROJECT_ID: "wrong" },
      { NEON_BRANCH_NAME: "production" },
      { AUTH_URL: "https://other.vercel.app" },
      {
        DATABASE_URL:
          "postgresql://operator:unused@other.neon.tech/real?sslmode=verify-full",
      },
      { CAREMETRICS_DEMO_DATA_ACK: undefined },
      { CAREMETRICS_DEPLOYMENT_KIND: "organisation" },
    ])
      expect(demoDeployment({ ...hosted, ...patch })).toBe(false)
  })
  it.each([
    { enabled: false },
    { retentionDays: 8 },
    { maxAgeMs: 0 },
    { maxAccuracyMetres: -1 },
    { earlyWindowMs: 1.5 },
    { maxFutureSkewMs: -1 },
    { approval: "production" },
    { mode: "HOUSE_VERIFIED" },
    { unexpected: true },
    { organisationId: "30000000-0000-4000-8000-000000000001" },
  ])("rejects altered or incomplete policy %j", (patch) => {
    expect(
      demoAttendancePolicy(org, {
        ...local,
        CAREMETRICS_DEMO_GPS_POLICY: JSON.stringify({
          ...demoPolicy(org),
          ...patch,
        }),
      }),
    ).toBeNull()
  })
  it("rejects missing limits and different organisation", () => {
    const p: Record<string, unknown> = demoPolicy(org)
    delete p.lateWindowMs
    expect(
      demoAttendancePolicy(org, {
        ...local,
        CAREMETRICS_DEMO_GPS_POLICY: JSON.stringify(p),
      }),
    ).toBeNull()
    expect(
      demoAttendancePolicy("30000000-0000-4000-8000-000000000001", local),
    ).toBeNull()
  })
})
