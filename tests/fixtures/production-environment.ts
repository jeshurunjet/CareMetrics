/** Exercise production-only service rules on a disposable local DB, without forbidden test deployment flags. */
export async function withProductionEnvironment(
  run: () => Promise<void>,
  key = "VERCEL_ENV",
) {
  const saved = { ...process.env }
  try {
    for (const name of [
      "NEON_BRANCH_NAME",
      "CAREMETRICS_SEED_CONFIRM",
      "CAREMETRICS_SEED_CREDENTIALS_FILE",
      "CAREMETRICS_GPS_TEST_POLICY_ACK",
      "CAREMETRICS_CLOCK_OUT_TEST_POLICY_ACK",
    ])
      delete process.env[name]
    process.env[key] = "production"
    process.env.AUTH_URL = "https://fictional-evaluation.example.test"
    await run()
  } finally {
    process.env = saved
  }
}
