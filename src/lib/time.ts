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
