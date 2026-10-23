import { toNZDateTimeInput, formatDate, formatTime } from "../../../lib/time"
/** Calendar arithmetic uses date-only UTC values; event display always uses NZ wall time. */
export const nzDay = (iso: string) => toNZDateTimeInput(iso).slice(0, 10)
export function validDay(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value
  )
}
export function addDays(day: string, count: number) {
  const date = new Date(`${day}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + count)
  return date.toISOString().slice(0, 10)
}
export function moveMonth(month: string, count: number) {
  const date = new Date(`${month}-01T12:00:00Z`)
  date.setUTCMonth(date.getUTCMonth() + count)
  return date.toISOString().slice(0, 7)
}
export function monthDays(month: string) {
  const first = `${month}-01`
  const offset = (new Date(`${first}T12:00:00Z`).getUTCDay() + 6) % 7
  return Array.from({ length: 42 }, (_, i) => addDays(first, i - offset))
}
export const dayLabel = (day: string) =>
  new Intl.DateTimeFormat("en-NZ", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${day}T12:00:00Z`))
export function shiftTime(start: string, end: string) {
  return `${formatTime(start)} – ${formatTime(end)}${
    nzDay(start) !== nzDay(end) ? ` (+1 day · ends ${formatDate(end)})` : ""
  }`
}
export function durationText(start?: string, end?: string) {
  if (!start || !end) return "—"
  const ms = Date.parse(end) - Date.parse(start)
  if (!Number.isFinite(ms) || ms < 0) return "Unavailable"
  const minutes = Math.round(ms / 60000)
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}
export const shiftOnDay = (start: string, end: string, day: string) =>
  nzDay(start) <= day &&
  day <= nzDay(new Date(Date.parse(end) - 1).toISOString())
