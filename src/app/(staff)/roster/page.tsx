import { notFound } from "next/navigation"
import { requirePreview } from "@/lib/require-preview"
import { developmentMockAdapter } from "@/modules/staff/data/development-mock-adapter"
import { getOwnShift, getOwnAttendance } from "@/modules/staff/roster/adapter"
import { validDay } from "@/modules/staff/roster/dates"
import Roster from "@/modules/staff/roster/Roster"
export default async function Page({ searchParams }: PageProps<"/roster">) {
  requirePreview()
  const q = await searchParams
  for (const key of [
    "tab",
    "house",
    "day",
    "month",
    "shiftId",
    "attendanceId",
    "action",
  ])
    if (Array.isArray(q[key])) notFound()
  const value = (key: string) =>
    typeof q[key] === "string" ? q[key] as string : ""
  const tab = value("tab") || "roster",
    house = value("house"),
    day = value("day"),
    month = value("month"),
    shiftId = value("shiftId"),
    attendanceId = value("attendanceId"),
    action = value("action")
  const s = developmentMockAdapter.getSnapshot(
    "s1",
    process.env.CAREMETRICS_DEMO_NOW || new Date().toISOString(),
  )
  if (
    !["roster", "team", "timesheets"].includes(tab) ||
    (house && !s.houses.some((h) => h.id === house)) ||
    (day && !validDay(day)) ||
    (month && !validDay(`${month}-01`)) ||
    (shiftId && !getOwnShift(s, shiftId)) ||
    (attendanceId && !getOwnAttendance(s, attendanceId)) ||
    (action && action !== "correction") ||
    (action && !attendanceId) ||
    (shiftId && attendanceId)
  )
    notFound()
  return <Roster />
}
