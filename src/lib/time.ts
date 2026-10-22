export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-NZ", {
    timeZone: "Pacific/Auckland",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(iso))
}
export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("en-NZ", {
    timeZone: "Pacific/Auckland",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso))
}
export const formatDateTime = (iso: string) =>
  `${formatDate(iso)}, ${formatTime(iso)}`
export const dayNumber = (iso: string) =>
  new Intl.DateTimeFormat("en-NZ", {
    timeZone: "Pacific/Auckland",
    day: "numeric",
  }).format(new Date(iso))
export const weekday = (iso: string) =>
  new Intl.DateTimeFormat("en-NZ", {
    timeZone: "Pacific/Auckland",
    weekday: "short",
  }).format(new Date(iso))
/** A birth date is a calendar date, not an event timestamp. */
export function formatDateOnly(date: string): string {
  return new Intl.DateTimeFormat("en-NZ", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00Z`))
}
export function ageOnDate(dob: string, now: string): number {
  const parts = new Intl.DateTimeFormat("en-NZ", {
    timeZone: "Pacific/Auckland",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(now))
  const part = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value)
  const [year, month, day] = dob.split("-").map(Number)
  return (
    part("year") -
    year -
    (part("month") < month || (part("month") === month && part("day") < day)
      ? 1
      : 0)
  )
}
/** datetime-local fields explicitly represent Pacific/Auckland, independent of device timezone. */
export function toNZDateTimeInput(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Pacific/Auckland",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso))
  const value = (type: string) => parts.find((p) => p.type === type)?.value
  return `${value("year")}-${value("month")}-${value("day")}T${value("hour")}:${value("minute")}`
}
export function fromNZDateTimeInput(local: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return ""
  const ms = Date.parse(`${local}:00Z`)
  if (!Number.isFinite(ms)) return ""
  const candidates = [12, 13]
    .map((offset) => new Date(ms - offset * 3600000).toISOString())
    .filter((iso) => toNZDateTimeInput(iso) === local)
  // Reject missing/ambiguous daylight-saving times rather than silently choosing one.
  return candidates.length === 1 ? candidates[0] : ""
}
