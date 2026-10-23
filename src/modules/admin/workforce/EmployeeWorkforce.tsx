"use client"
import Link from "next/link"
import { useAdmin, Panel, DataTable, Pill } from "../ui/core"
import { formatDateTime } from "@/lib/time"
import { leaveTypeName, leaveStatusLabel } from "../../staff/leave/adapter"
import { managementAttendanceStatus } from "./adapter"
export default function EmployeeWorkforce({
  id,
  tab,
}: {
  id: string
  tab: string
}) {
  const { data: s } = useAdmin()
  return (
    <Panel title={`${tab[0].toUpperCase() + tab.slice(1)} preview`}>
      <p className="ad-faint">
        Shared development records · operational review only.
      </p>
      {tab === "leave" ? (
        <DataTable
          rows={s.leaveRequests.filter((l) => l.employeeId === id)}
          cols={[
            {
              key: "type",
              label: "Leave type",
              render: (l) => leaveTypeName(s, l.typeId),
            },
            {
              key: "dates",
              label: "Dates",
              render: (l) => `${l.start} – ${l.end}`,
            },
            {
              key: "status",
              label: "Status",
              render: (l) => <Pill s={leaveStatusLabel(l.status)} />,
            },
            {
              key: "action",
              label: "Actions",
              render: (l) => (
                <Link
                  className="ad-link"
                  href={`/admin/leave?tab=all&requestId=${l.id}`}
                >
                  View request
                </Link>
              ),
            },
          ]}
        />
      ) : (
        <DataTable
          rows={s.shifts.filter((sh) => sh.staffId === id)}
          cols={[
            {
              key: "date",
              label: "Scheduled start",
              render: (sh) => formatDateTime(sh.start),
            },
            {
              key: "end",
              label: "Scheduled end",
              render: (sh) => formatDateTime(sh.end),
            },
            {
              key: "status",
              label: "Status",
              render: (sh) =>
                tab === "attendance"
                  ? managementAttendanceStatus(s, sh)
                  : sh.status === "cancelled"
                    ? "Cancelled"
                    : "Scheduled",
            },
            {
              key: "action",
              label: "Actions",
              render: (sh) => {
                const a = s.attendance.find((a) => a.shiftId === sh.id)
                return (
                  <Link
                    className="ad-link"
                    href={`/admin/roster?${
                      tab === "attendance" && a
                        ? `tab=timesheets&attendanceId=${a.id}`
                        : `shiftId=${sh.id}`
                    }`}
                  >
                    View details
                  </Link>
                )
              },
            },
          ]}
        />
      )}
    </Panel>
  )
}
