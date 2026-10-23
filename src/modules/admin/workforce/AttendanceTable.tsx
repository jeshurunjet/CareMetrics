"use client"
import { useState } from "react"
import { useAdmin, DataTable, Pill, Stat, Select } from "../ui/core"
import { Banner, Btn } from "../../staff/ui"
import { formatDate, formatTime } from "@/lib/time"
import { nzDay, shiftTime, durationText } from "../../staff/roster/dates"
import { effectiveAttendance } from "../../staff/roster/effective"
import { managementAttendanceStatus } from "./adapter"
import {
  useWorkforceFilters,
  FilterBar,
  EmployeeLink,
  HouseLink,
  matchesEmployee,
  useWorkforceURL,
} from "./shared"
export default function AttendanceTable({
  timesheets,
}: {
  timesheets: boolean
}) {
  const { data: s } = useAdmin(),
    f = useWorkforceFilters(timesheets ? "" : nzDay(s.now)),
    { change } = useWorkforceURL(),
    [missing, setMissing] = useState("")
  const att = (id: string) => {
    const a = s.attendance.find((a) => a.shiftId === id)
    return a ? effectiveAttendance(s, a) : undefined
  }
  const rows = s.shifts
    .filter(
      (sh) =>
        (!timesheets || sh.start <= s.now) &&
        sh.status !== "cancelled" &&
        matchesEmployee(
          f,
          sh.staffId,
          s.staff.find((e) => e.id === sh.staffId)?.name || "",
          sh.id,
        ) &&
        (!f.house || sh.houseId === f.house) &&
        (!f.from || nzDay(sh.start) >= f.from) &&
        (!f.to || nzDay(sh.start) <= f.to) &&
        (!f.status || managementAttendanceStatus(s, sh) === f.status) &&
        (!missing ||
          (missing === "in"
            ? !att(sh.id)?.clockIn
            : !!att(sh.id)?.clockIn && !att(sh.id)?.clockOut)),
    )
    .sort((a, b) => b.start.localeCompare(a.start))
  const tm = (v?: string) => (v ? formatTime(v) : "—"),
    today = s.shifts.filter(
      (sh) => sh.status !== "cancelled" && nzDay(sh.start) === nzDay(s.now),
    )
  return (
    <>
      {!timesheets && (
        <div className="ad-stats ad-stats--4">
          <Stat icon="calendar" label="Shifts today" value={today.length} />
          <Stat
            icon="check"
            tone="success"
            label="Recorded clock-in (fictional)"
            value={today.filter((sh) => att(sh.id)?.clockIn).length}
          />
          <Stat
            icon="alert"
            tone="danger"
            label="Attendance issues"
            value={
              today.filter((sh) =>
                managementAttendanceStatus(s, sh).startsWith("Missing"),
              ).length
            }
          />
          <Stat
            icon="clock"
            tone="warning"
            label="Pending corrections"
            value={
              s.attendanceCorrections.filter((c) => c.status === "pending")
                .length
            }
          />
        </div>
      )}
      <Banner tone="info">
        Scheduled time and recorded time are separate. Effective corrections are
        manual management decisions, never successful GPS checks. No continuous
        tracking or payroll approval.
      </Banner>
      <FilterBar
        f={f}
        statuses={[
          "Not Started",
          "In Progress",
          "Completed",
          "Missing Clock-in",
          "Missing Clock-out",
          "Correction Pending",
        ]}
      />
      {!timesheets && (
        <Select
          label="Missing events"
          value={missing}
          onChange={setMissing}
          options={[
            { value: "", label: "All events" },
            { value: "in", label: "Missing clock-in" },
            { value: "out", label: "Missing clock-out" },
          ]}
        />
      )}
      <div className="ad-workforce-table ad-workforce-table--wide">
        <DataTable
          rows={rows}
          onRow={(sh) => {
            const a = att(sh.id)
            change(a ? { attendanceId: a.id } : { shiftId: sh.id })
          }}
          cols={[
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
              key: "date",
              label: "Shift date",
              render: (r) => formatDate(r.start),
            },
            {
              key: "scheduled",
              label: "Scheduled start / end",
              render: (r) => shiftTime(r.start, r.end),
            },
            {
              key: "hours",
              label: "Scheduled hours",
              render: (r) => durationText(r.start, r.end),
            },
            {
              key: "in",
              label: "Actual clock-in",
              render: (r) => tm(att(r.id)?.clockIn),
            },
            {
              key: "out",
              label: "Actual clock-out",
              render: (r) => tm(att(r.id)?.clockOut),
            },
            {
              key: "duration",
              label: "Recorded duration",
              render: (r) =>
                durationText(att(r.id)?.clockIn, att(r.id)?.clockOut),
            },
            {
              key: "state",
              label: "Attendance status",
              render: (r) => <Pill s={managementAttendanceStatus(s, r)} />,
            },
            {
              key: "location",
              label: "Location demonstration",
              render: (r) => att(r.id)?.location || "No event",
            },
            {
              key: "issue",
              label: timesheets ? "Correction status" : "Issue",
              render: (r) =>
                timesheets
                  ? s.attendanceCorrections
                      .filter((c) => c.shiftId === r.id)
                      .map((c) => c.status)
                      .join(", ") || "—"
                  : managementAttendanceStatus(s, r).startsWith("Missing")
                    ? managementAttendanceStatus(s, r)
                    : "—",
            },
            {
              key: "actions",
              label: "Actions",
              render: (r) => (
                <Btn
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const a = att(r.id)
                    change(a ? { attendanceId: a.id } : { shiftId: r.id })
                  }}
                >
                  View details
                </Btn>
              ),
            },
          ]}
        />
      </div>
    </>
  )
}
