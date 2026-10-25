import { readFile } from "node:fs/promises"
// Explicit fixtures for separate fictional tenants, never imported by application code.
export async function testAttendancePolicyEnvironment() {
  const read = async (name) =>
    JSON.parse(
      await readFile(
        new URL(`../tests/fixtures/${name}.json`, import.meta.url),
        "utf8",
      ),
    )
  return {
    CAREMETRICS_GPS_TEST_POLICY_ACK: "fictional-development-only",
    CAREMETRICS_GPS_POLICIES: JSON.stringify([
      await read("gps-policy"),
      await read("clock-out-gps-policy"),
      await read("diary-gps-policy"),
    ]),
    CAREMETRICS_CLOCK_OUT_TEST_POLICY_ACK: "fictional-development-only",
    CAREMETRICS_CLOCK_OUT_POLICIES: JSON.stringify([
      await read("clock-out-policy"),
    ]),
  }
}
