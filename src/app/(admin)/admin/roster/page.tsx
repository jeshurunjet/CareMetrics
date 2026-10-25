import { deferredPage } from "@/server/data/deferred-page"
import AttendanceHistoryView from "@/modules/attendance/AttendanceHistoryView"
import { getAdminAttendanceHistory } from "@/server/attendance/history"
import { notFound } from "next/navigation"
import { isBackendEnabled } from "@/server/config/backend"
import { staffPage } from "@/server/data/page"
import { getAdminSchedule } from "@/server/scheduling/shifts"
import AdminScheduleView from "@/modules/scheduling/AdminSchedule"
import AdminAccess from "@/modules/admin/ui/AdminAccess"
import RosterPage from "@/modules/admin/workforce/RosterPage"
import { validateWorkforceQuery } from "@/modules/admin/workforce/route-validation"
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const q = await searchParams
  if (isBackendEnabled()) {
    if (q.tab === "corrections") return deferredPage(true)
    if (q.tab === "attendance" || q.tab === "timesheets") {
      const tab = q.tab,
        query = Object.fromEntries(
          Object.entries(q).filter(([key]) => key !== "tab"),
        )
      return staffPage(
        () => getAdminAttendanceHistory(query),
        (data) => (
          <AttendanceHistoryView
            key={JSON.stringify(data.filters)}
            admin
            tab={tab}
            data={data}
          />
        ),
      )
    }
    if (
      Object.keys(q).some(
        (key) =>
          !["tab", "month", "day", "shiftId", "action", "house"].includes(key),
      ) ||
      Object.values(q).some((value) => Array.isArray(value))
    )
      notFound()
    const tab = typeof q.tab === "string" ? q.tab : "calendar",
      action = typeof q.action === "string" ? q.action : ""
    if (
      ![
        "calendar",
        "shifts",
        "attendance",
        "timesheets",
        "corrections",
      ].includes(tab) ||
      !["", "new", "edit", "cancel"].includes(action) ||
      (action === "new" && q.shiftId) ||
      (["edit", "cancel"].includes(action) && !q.shiftId)
    )
      notFound()
    const query = Object.fromEntries(
      Object.entries(q).filter(([key]) =>
        ["day", "month", "shiftId"].includes(key),
      ),
    )
    return staffPage(
      () => getAdminSchedule(query),
      (data) => {
        if (q.house && !data.houses.some((h) => h.id === q.house && h.active))
          notFound()
        return <AdminScheduleView data={data} tab={tab} action={action} />
      },
    )
  }
  validateWorkforceQuery(q, false)
  return (
    <AdminAccess>
      <RosterPage />
    </AdminAccess>
  )
}
