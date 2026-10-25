import { isBackendEnabled } from "@/server/config/backend"
import { staffPage } from "@/server/data/page"
import { getStaffSchedule } from "@/server/scheduling/shifts"
import StaffScheduleView from "@/modules/scheduling/StaffSchedule"
import { notFound } from "next/navigation"
import { requirePreview } from "@/lib/require-preview"
import StaffRouteScopeGuard from "@/modules/preview/StaffRouteScopeGuard"
import { validDay } from "@/modules/staff/roster/dates"
import Roster from "@/modules/staff/roster/Roster"
export default async function Page({ searchParams }: PageProps<"/roster">) {
  const q = await searchParams
  if (isBackendEnabled()) {
    const tab = q.tab ?? "roster"
    if (
      typeof tab !== "string" ||
      !["roster", "team", "timesheets"].includes(tab) ||
      Object.keys(q).some(
        (key) => !["tab", "month", "day", "shiftId", "house"].includes(key),
      )
    )
      notFound()
    const query = Object.fromEntries(
      Object.entries(q).filter(([key]) => key !== "tab"),
    )
    return staffPage(
      () => getStaffSchedule(query),
      (data) => <StaffScheduleView data={data} view="roster" tab={tab} />,
    )
  }
  requirePreview()
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
