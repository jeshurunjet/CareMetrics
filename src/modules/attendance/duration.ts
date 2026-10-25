/** Recorded elapsed time is not approved payroll time. Event instants are UTC. */
export function elapsedMilliseconds(
  clockIn: string | null,
  clockOut: string | null,
): number | null {
  if (!clockIn || !clockOut) return null
  const value = Date.parse(clockOut) - Date.parse(clockIn)
  return Number.isFinite(value) && value >= 0 ? value : null
}
export function formatElapsed(value: number | null): string {
  if (value === null || !Number.isFinite(value) || value < 0) return "—"
  if (value > 0 && value < 60000) return "<1 min"
  return `${Math.floor(value / 3600000)}h ${Math.floor((value % 3600000) / 60000)}m`
}
export function attendanceInstant(value: string | null): string {
  if (!value || !Number.isFinite(Date.parse(value))) return "—"
  return new Intl.DateTimeFormat("en-NZ", {
    timeZone: "Pacific/Auckland",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value))
}
