/** Validate without ever placing connection details in an error message. */
export function databaseConnection(value: string, direct = false): string {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error("Database configuration unavailable")
  }
  if (
    !["postgresql:", "postgres:"].includes(url.protocol) ||
    !url.hostname ||
    !url.pathname.slice(1)
  )
    throw new Error("Database configuration unavailable")
  if (direct && url.hostname.includes("-pooler."))
    throw new Error("Direct database connection required")
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
  // Neon pulls sslmode=require; strengthen it rather than disabling certificate verification.
  if (
    url.hostname.endsWith(".neon.tech") &&
    url.searchParams.get("sslmode") === "require"
  )
    url.searchParams.set("sslmode", "verify-full")
  if (
    !local &&
    !["verify-full", "verify-ca"].includes(
      url.searchParams.get("sslmode") || "",
    )
  )
    throw new Error("Verified database TLS required")
  return url.toString()
}
