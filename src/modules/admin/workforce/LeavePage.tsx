"use client"
import {
  useAdmin,
  PageHead,
  SubTabs,
  Stat,
  DataTable,
  Pill,
  Select,
} from "../ui/core"
import { Banner } from "../../staff/ui"
import { useState } from "react"
import { formatDateTime } from "@/lib/time"
import { leaveStatusLabel, leaveTypeName } from "../../staff/leave/adapter"
import { nzDay } from "../../staff/roster/dates"
import { leaveConflicts } from "./adapter"
import {
  useWorkforceURL,
  useWorkforceFilters,
  FilterBar,
  EmployeeLink,
  matchesEmployee,
} from "./shared"
import LeavePanel from "./LeavePanel"
import LeaveCalendar from "./LeaveCalendar"
export default function LeavePage() {
  const { data: s } = useAdmin(),
    { q, change } = useWorkforceURL("/admin/leave"),
    tab = q.get("tab") || "pending",
    f = useWorkforceFilters(),
    [type, setType] = useState("")
  const rows = s.leaveRequests.filter(
    (l) =>
      matchesEmployee(
        f,
        l.employeeId,
        s.staff.find((e) => e.id === l.employeeId)?.name || "",
        l.id,
      ) &&
      (!f.house ||
        s.assignments.some(
          (a) => a.employeeId === l.employeeId && a.houseId === f.house,
        )) &&
      (!type || l.typeId === type) &&
      (!f.from || l.end >= f.from) &&
      (!f.to || l.start <= f.to) &&
      (tab === "pending" ||
        !f.status ||
        leaveStatusLabel(l.status) === f.status) &&
      (tab !== "pending" || l.status === "pending"),
  )
  return (
    <>
      <PageHead
        title="Leave Management"
        sub="Review shared leave requests and roster conflicts. No entitlement or payroll calculations."
      />
      <div className="ad-stats ad-stats--3">
        <Stat
          icon="umbrella"
          tone="warning"
          label="Pending requests"
          value={s.leaveRequests.filter((l) => l.status === "pending").length}
        />
        <Stat
          icon="check"
          tone="success"
          label="Approved (upcoming)"
          value={
            s.leaveRequests.filter(
              (l) => l.status === "approved" && l.end >= nzDay(s.now),
            ).length
          }
        />
        <Stat
          icon="alert"
          tone="danger"
          label="Pending with roster conflicts"
          value={
            s.leaveRequests.filter(
              (l) => l.status === "pending" && leaveConflicts(s, l.id).length,
            ).length
          }
        />
      </div>
      <SubTabs
        value={tab}
        onChange={(t) => change({ tab: t, requestId: "" })}
        tabs={[
          { id: "pending", label: "Pending requests" },
          { id: "all", label: "All requests" },
          { id: "calendar", label: "Leave calendar" },
        ]}
      />
      <Banner tone="info">
        Fictional development session only. Approval does not cancel or reassign
        shifts, deduct balances or send notifications.
      </Banner>
      <FilterBar
        f={f}
        statuses={
          tab === "pending" ? [] : ["Pending Review", "Approved", "Rejected"]
        }
      />
      <Select
        label="Leave type"
        value={type}
        onChange={setType}
        options={[
          { value: "", label: "All types" },
          ...s.leaveTypes.map((t) => ({ value: t.id, label: t.name })),
        ]}
      />
      {tab === "calendar" ? (
        <LeaveCalendar rows={rows} />
      ) : (
        <div className="ad-workforce-table">
          <DataTable
            rows={rows}
            onRow={(l) => change({ requestId: l.id })}
            cols={[
              {
                key: "e",
                label: "Employee",
                render: (l) => <EmployeeLink id={l.employeeId} />,
              },
              {
                key: "t",
                label: "Leave type",
                render: (l) => leaveTypeName(s, l.typeId),
              },
              {
                key: "start",
                label: "Start date",
                sort: (l) => l.start,
                render: (l) => l.start,
              },
              { key: "end", label: "End date", render: (l) => l.end },
              {
                key: "submitted",
                label: "Submitted",
                render: (l) => formatDateTime(l.submittedAt),
              },
              {
                key: "conflicts",
                label: "Roster",
                render: (l) =>
                  leaveConflicts(s, l.id).length ? (
                    <Pill
                      s="Late"
                      label={`${leaveConflicts(s, l.id).length} shift conflicts`}
                    />
                  ) : (
                    "No conflicts"
                  ),
              },
              {
                key: "status",
                label: "Status",
                render: (l) => <Pill s={leaveStatusLabel(l.status)} />,
              },
              {
                key: "reviewer",
                label: "Reviewer",
                render: (l) => l.decision?.reviewerName || "—",
              },
              {
                key: "action",
                label: "Actions",
                render: (l) => (
                  <button
                    className="ad-link"
                    onClick={() => change({ requestId: l.id })}
                  >
                    Review {l.id}
                  </button>
                ),
              },
            ]}
          />
        </div>
      )}{" "}
      {q.get("requestId") && (
        <LeavePanel
          key={q.get("requestId")}
          id={q.get("requestId")!}
          onClose={() => change({ requestId: "" })}
        />
      )}
    </>
  )
}
