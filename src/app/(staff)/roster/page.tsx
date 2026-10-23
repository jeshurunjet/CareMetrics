import { notFound } from "next/navigation"
import { requirePreview } from "@/lib/require-preview"
import StaffRouteScopeGuard from "@/modules/preview/StaffRouteScopeGuard"
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
    day = value("day"),
    month = value("month"),
    shiftId = value("shiftId"),
    attendanceId = value("attendanceId"),
    action = value("action")
  if (
    !["roster", "team", "timesheets"].includes(tab) ||
    (day && !validDay(day)) ||
    (month && !validDay(`${month}-01`)) ||
    (action && action !== "correction") ||
    (action && !attendanceId) ||
    (shiftId && attendanceId)
  )
    notFound()
  return (
    <StaffRouteScopeGuard kind="roster" q={q}>
      <Roster />
    </StaffRouteScopeGuard>
  )
}
