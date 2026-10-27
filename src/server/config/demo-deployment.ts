import "server-only"
// Approved fictional staging identity. These are public identifiers, not credentials.
export const DEMO_TARGET = {
  vercelProjectId: "prj_5f4HqMGoSablRWqH8HQGs4rvlwU1",
  origin: "https://caremetrics-staging.vercel.app",
  databaseHost: "ep-silent-scene-a79j4tw3.ap-southeast-2.aws.neon.tech",
  databaseName: "caremetrics_staging",
  organisationId: "20000000-0000-4000-8000-000000000001",
} as const
export function demoDeployment(
  env: Record<string, string | undefined> = process.env,
): boolean {
  if (
    env.CAREMETRICS_DEPLOYMENT_KIND !== "fictional-demo" ||
    env.CAREMETRICS_DEMO_DATA_ACK !== "fictional-records-only"
  )
    return false
  try {
    const db = new URL(env.DATABASE_URL ?? ""),
      app = new URL(env.AUTH_URL ?? "")
    const local = ["localhost", "127.0.0.1", "[::1]"]
    if (
      env.NODE_ENV !== "production" &&
      env.VERCEL_ENV !== "production" &&
      env.NEON_BRANCH_NAME === "local-test" &&
      !env.VERCEL &&
      local.includes(db.hostname) &&
      local.includes(app.hostname) &&
      /^caremetrics_[a-z0-9_]*test$/.test(db.pathname.slice(1))
    )
      return true
    return (
      env.VERCEL === "1" &&
      env.VERCEL_PROJECT_ID === DEMO_TARGET.vercelProjectId &&
      env.NEON_BRANCH_NAME === "staging" &&
      app.origin === DEMO_TARGET.origin &&
      app.pathname === "/" &&
      !app.search &&
      !app.hash &&
      !app.username &&
      !app.password &&
      env.CAREMETRICS_DEMO_ORGANISATION_ID === DEMO_TARGET.organisationId &&
      db.hostname.replace("-pooler.", ".") === DEMO_TARGET.databaseHost &&
      db.pathname === "/" + DEMO_TARGET.databaseName &&
      ["verify-full", "verify-ca"].includes(
        db.searchParams.get("sslmode") ?? "",
      )
    )
  } catch {
    return false
  }
}
