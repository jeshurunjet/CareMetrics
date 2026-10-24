/** Local UI preview only. Never use this flag as authentication. */
export function isPreviewEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return (
    env.NODE_ENV === "development" &&
    env.CAREMETRICS_UI_PREVIEW === "true" &&
    env.CAREMETRICS_BACKEND_MODE !== "database"
  )
}
