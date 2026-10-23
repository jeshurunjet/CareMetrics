"use client"
import { useAdmin, DataTable, Pill } from "../ui/core"
import { Btn } from "../../staff/ui"
import { formatDate } from "@/lib/time"
import { nzDay, shiftTime } from "../../staff/roster/dates"
import { managementAttendanceStatus } from "./adapter"
import {
  useWorkforceFilters,
  FilterBar,
  EmployeeLink,
  HouseLink,
  matchesEmployee,
  useWorkforceURL,
} from "./shared"
export default function ShiftTable() {
  const { data: s } = useAdmin(),
    f = useWorkforceFilters("", "Upcoming"),
    { change } = useWorkforceURL()
  const rows = s.shifts
    .filter(
      (sh) =>
        matchesEmployee(
          f,
          sh.staffId,
          s.staff.find((e) => e.id === sh.staffId)?.name || "",
          sh.id,
        ) &&
        (!f.house || sh.houseId === f.house) &&
        (!f.from || nzDay(sh.start) >= f.from) &&
        (!f.to || nzDay(sh.start) <= f.to) &&
        (!f.status ||
          (f.status === "Cancelled"
            ? sh.status === "cancelled"
            : sh.status !== "cancelled" &&
              (f.status === "Upcoming"
                ? sh.end > s.now
                : f.status === "Past"
                  ? sh.end <= s.now
                  : true))),
    )
    .sort((a, b) => a.start.localeCompare(b.start))
  return (
    <>
      <FilterBar
        f={f}
        statuses={["Upcoming", "Past", "Scheduled", "Cancelled"]}
      />
      <div className="ad-workforce-table">
        <DataTable
          rows={rows}
          onRow={(sh) => change({ shiftId: sh.id })}
          cols={[
            {
              key: "date",
              label: "Date",
              sort: (r) => r.start,
              render: (r) => <b>{formatDate(r.start)}</b>,
            },
            {
              key: "employee",
              label: "Employee",
              render: (r) => <EmployeeLink id={r.staffId} />,
            },
            {
              key: "house",
              label: "House",
              render: (r) => <HouseLink id={r.houseId} />,
            },
            {
              key: "time",
              label: "Start / end",
              render: (r) => shiftTime(r.start, r.end),
            },
            {
              key: "assigned",
              label: "Assigned by",
              render: (r) => r.assignedBy,
            },
            {
              key: "status",
              label: "Shift status",
              render: (r) => (
                <Pill
                  s={r.status === "cancelled" ? "Cancelled" : "Scheduled"}
                />
              ),
            },
            {
              key: "attendance",
              label: "Attendance",
              render: (r) => <Pill s={managementAttendanceStatus(s, r)} />,
            },
            {
              key: "actions",
              label: "Actions",
              render: (r) => (
                <div className="ad-inline">
                  <Btn
                    size="sm"
                    variant="ghost"
                    onClick={() => change({ shiftId: r.id })}
                  >
                    View
                  </Btn>
                  {r.status !== "cancelled" && (
                    <>
                      <Btn
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          change({ shiftId: r.id, action: "edit" })
                        }
                      >
                        Edit
                      </Btn>
                      <Btn
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          change({ shiftId: r.id, action: "cancel" })
                        }
                      >
                        Cancel shift
                      </Btn>
                    </>
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>
    </>
  )
}
