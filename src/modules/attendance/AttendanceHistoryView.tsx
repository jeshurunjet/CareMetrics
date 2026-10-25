"use client"
import Link from "next/link"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  PageHeader,
  Btn,
  Banner,
  Card,
  Empty,
  Status,
  Modal,
  SectionTitle,
} from "@/modules/staff/ui"
import Tabs from "@/modules/staff/ui/Tabs"
import { PageHead, SubTabs, DataTable, Select } from "@/modules/admin/ui/core"
import Drawer from "@/modules/admin/workforce/Drawer"
import ClockOutControl from "./ClockOutControl"
import { attendanceInstant, formatElapsed } from "./duration"
import { formatDate } from "@/lib/time"
import { shiftTime } from "@/modules/staff/roster/dates"
import type { AttendanceHistory, AttendanceRead } from "./types"
interface Props {
  data: AttendanceHistory
  admin?: boolean
  tab?: string
}
export default function AttendanceHistoryView({
  data,
  admin = false,
  tab = "timesheets",
}: Props) {
  const router = useRouter(),
    params = useSearchParams(),
    [filters, setFilters] = useState(data.filters),
    [error, setError] = useState("")
  const base = admin ? "/admin/roster" : "/roster"
  const change = (patch: Record<string, string>) => {
    const q = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(patch)) {
      if (v) q.set(k, v)
      else q.delete(k)
    }
    router.push(base + "?" + q.toString())
  }
  const patch = (key: string, value: string) =>
    setFilters({ ...filters, [key]: value })
  const tabs = [
    { id: "calendar", label: "Roster calendar" },
    { id: "shifts", label: "Shift list" },
    { id: "attendance", label: "Attendance monitor" },
    { id: "timesheets", label: "Timesheets" },
    { id: "corrections", label: "Attendance corrections" },
  ]
  const complete = data.rows.filter((r) => r.status === "COMPLETED"),
    open = data.rows.filter((r) => r.status === "OPEN")
  const status = (r: AttendanceRead) => (
    <Status tone={r.status === "OPEN" ? "warning" : "neutral"}>
      {r.status === "OPEN"
        ? "Open"
        : r.status === "COMPLETED"
          ? "Completed"
          : "Incomplete record"}
    </Status>
  )
  const view = (r: AttendanceRead) => (
    <Btn
      size="sm"
      variant="ghost"
      onClick={() => change({ attendanceId: r.id })}
    >
      View details
    </Btn>
  )
  return (
    <>
      {admin ? (
        <>
          <PageHead
            title="Rosters & Attendance"
            sub="Recorded attendance · Pacific/Auckland."
            actions={
              <Btn onClick={() => router.push("/admin/roster?action=new")}>
                Create shift
              </Btn>
            }
          />
          <SubTabs
            tabs={tabs}
            value={tab}
            onChange={(t) => router.push(`/admin/roster?tab=${t}`)}
          />
        </>
      ) : (
        <>
          <PageHeader
            title="Roster & Timesheets"
            subtitle="Your recorded attendance · Pacific/Auckland."
          />
          <Tabs
            label="Roster sections"
            value="timesheets"
            onChange={(t) => router.push(`/roster?tab=${t}`)}
            tabs={[
              { id: "roster", label: "My roster", icon: "calendar" },
              { id: "team", label: "Team schedule", icon: "users" },
              { id: "timesheets", label: "My timesheets", icon: "clock" },
            ]}
          />
        </>
      )}
      <div className="cm-stack">
        <Banner tone="info">
          Recorded elapsed attendance is separate from scheduled time. Payroll,
          approvals and corrections remain unavailable.
        </Banner>
        <div className="cm-toolbar">
          <label className="cm-filter cm-roster-date-filter">
            From
            <input
              aria-label="Attendance from"
              className="cm-input"
              type="date"
              value={filters.from ?? ""}
              onChange={(e) => patch("from", e.target.value)}
            />
          </label>
          <label className="cm-filter cm-roster-date-filter">
            To
            <input
              aria-label="Attendance to"
              className="cm-input"
              type="date"
              value={filters.to ?? ""}
              onChange={(e) => patch("to", e.target.value)}
            />
          </label>
          <Select
            label="House"
            value={filters.house ?? ""}
            onChange={(v) => patch("house", v)}
            options={[
              { value: "", label: "All houses" },
              ...data.houses.map((h) => ({ value: h.id, label: h.name })),
            ]}
          />
          {admin && (
            <Select
              label="Employee"
              value={filters.employee ?? ""}
              onChange={(v) => patch("employee", v)}
              options={[
                { value: "", label: "All employees" },
                ...data.employees.map((e) => ({ value: e.id, label: e.name })),
              ]}
            />
          )}
          <Select
            label="Attendance status"
            value={filters.status ?? ""}
            onChange={(v) => patch("status", v)}
            options={[
              { value: "", label: "All statuses" },
              { value: "open", label: "Open" },
              { value: "completed", label: "Completed" },
              { value: "incomplete", label: "Incomplete record" },
            ]}
          />
          <Btn
            variant="secondary"
            onClick={() => {
              if (filters.from && filters.to && filters.from > filters.to) {
                setError("End date must be on or after start date.")
                return
              }
              setError("")
              change({ ...filters, page: "", attendanceId: "" })
            }}
          >
            Apply filters
          </Btn>
        </div>
        {error && (
          <p role="alert" className="cm-error">
            {error}
          </p>
        )}
        {!admin && (
          <div className="cm-stat-row">
            <Card className="cm-stat">
              <span>Recorded elapsed · this page</span>
              <strong>
                {formatElapsed(
                  complete.reduce(
                    (sum, r) => sum + (r.elapsedMilliseconds ?? 0),
                    0,
                  ),
                )}
              </strong>
            </Card>
            <Card className="cm-stat">
              <span>Completed records · this page</span>
              <strong>{complete.length}</strong>
            </Card>
            <Card className="cm-stat">
              <span>Open records · this page</span>
              <strong>{open.length}</strong>
            </Card>
          </div>
        )}
        {!data.rows.length ? (
          <Empty icon="clock" title="No attendance in this range" />
        ) : admin ? (
          <div className="ad-workforce-table ad-workforce-table--wide">
            <DataTable
              per={20}
              rows={data.rows}
              onRow={(r) => change({ attendanceId: r.id })}
              cols={[
                {
                  key: "employee",
                  label: "Employee",
                  render: (r) => r.employeeName,
                },
                { key: "house", label: "House", render: (r) => r.houseName },
                {
                  key: "date",
                  label: "Shift date",
                  render: (r) => formatDate(r.startsAt),
                },
                {
                  key: "scheduled",
                  label: "Scheduled start / end",
                  render: (r) => shiftTime(r.startsAt, r.endsAt),
                },
                {
                  key: "in",
                  label: "Actual clock-in",
                  render: (r) => attendanceInstant(r.clockIn),
                },
                {
                  key: "out",
                  label: "Actual clock-out",
                  render: (r) => attendanceInstant(r.clockOut),
                },
                {
                  key: "duration",
                  label: "Recorded elapsed",
                  render: (r) => formatElapsed(r.elapsedMilliseconds),
                },
                { key: "status", label: "Status", render: status },
                { key: "actions", label: "Actions", render: view },
              ]}
            />
          </div>
        ) : (
          <div
            className="cm-table-wrap cm-timesheet-table"
            tabIndex={0}
            role="region"
            aria-label="My attendance table, scroll horizontally"
          >
            <table className="cm-table">
              <caption className="sr-only">
                Own recorded attendance, newest first
              </caption>
              <thead>
                <tr>
                  {[
                    "Date",
                    "House",
                    "Rostered",
                    "Clock in",
                    "Clock out",
                    "Recorded elapsed",
                    "Status",
                    "Actions",
                  ].map((label) => (
                    <th key={label} scope="col">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.id} data-attendance-id={r.id}>
                    <th scope="row">{formatDate(r.startsAt)}</th>
                    <td>{r.houseName}</td>
                    <td>{shiftTime(r.startsAt, r.endsAt)}</td>
                    <td>{attendanceInstant(r.clockIn)}</td>
                    <td>{attendanceInstant(r.clockOut)}</td>
                    <td>{formatElapsed(r.elapsedMilliseconds)}</td>
                    <td>{status(r)}</td>
                    <td>{view(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data.total > data.per && (
          <nav className="cm-pagination" aria-label="Attendance history pages">
            <span>
              {(data.page - 1) * data.per + 1}–
              {Math.min(data.page * data.per, data.total)} of {data.total}
            </span>
            <div>
              <Btn
                variant="ghost"
                disabled={data.page === 1}
                onClick={() =>
                  change({ page: String(data.page - 1), attendanceId: "" })
                }
              >
                Previous page
              </Btn>
              <span>
                Page {data.page} of {Math.ceil(data.total / data.per)}
              </span>
              <Btn
                variant="ghost"
                disabled={data.page * data.per >= data.total}
                onClick={() =>
                  change({ page: String(data.page + 1), attendanceId: "" })
                }
              >
                Next page
              </Btn>
            </div>
          </nav>
        )}
        {!admin && (
          <Link className="cm-btn cm-btn--secondary" href="/shift-check">
            My Shifts
          </Link>
        )}
      </div>
      {data.detail &&
        (admin ? (
          <Drawer
            title="Attendance details"
            sub={data.detail.houseName}
            onClose={() => change({ attendanceId: "" })}
          >
            <AttendanceFacts admin record={data.detail} />
            <Banner tone="info">
              Recorded elapsed attendance only. Manual overrides, payroll
              approval and corrections remain unavailable.
            </Banner>
          </Drawer>
        ) : (
          <Modal
            title="Attendance details"
            subtitle={data.detail.houseName}
            onClose={() => change({ attendanceId: "" })}
          >
            <AttendanceFacts record={data.detail} />
            <ClockOutControl
              key={data.detail.id}
              attendanceId={data.detail.id}
              availability={data.detail.clockOutAvailability}
            />
            <Banner tone="info">
              Recorded elapsed attendance only. No payroll approval or
              correction workflow is available.
            </Banner>
          </Modal>
        ))}
    </>
  )
}
export function AttendanceFacts({
  record,
  admin = false,
}: {
  record: AttendanceRead
  admin?: boolean
}) {
  const items = [
    ["Attendance ID", record.id],
    ["Shift ID", record.shiftId],
    ["Employee", record.employeeName],
    ["House", record.houseName],
    ["Scheduled", shiftTime(record.startsAt, record.endsAt)],
    ["Clock in", attendanceInstant(record.clockIn)],
    ["Clock out", attendanceInstant(record.clockOut)],
    ["Recorded elapsed", formatElapsed(record.elapsedMilliseconds)],
    [
      "Status",
      record.status === "OPEN"
        ? "Open"
        : record.status === "COMPLETED"
          ? "Completed"
          : "Incomplete record",
    ],
  ]
  return (
    <dl
      className={admin ? "ad-kv" : "cm-dl"}
      style={
        admin ? { gridTemplateColumns: "repeat(2,minmax(0,1fr))" } : undefined
      }
    >
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}
export function OwnAttendanceSummary({ record }: { record: AttendanceRead }) {
  return (
    <Card className="cm-panel">
      <SectionTitle title="Your attendance" />
      <Status tone={record.status === "OPEN" ? "success" : "neutral"}>
        {record.clockOut ? "Clocked Out" : "Clocked In"}
      </Status>
      <p>
        {record.houseName} · Recorded {attendanceInstant(record.clockIn)}
      </p>
      {record.clockOut && (
        <p>
          Clock-out {attendanceInstant(record.clockOut)} ·{" "}
          {formatElapsed(record.elapsedMilliseconds)} recorded elapsed
        </p>
      )}
      <ClockOutControl
        key={record.id}
        attendanceId={record.id}
        availability={record.clockOutAvailability}
      />
      <Link
        className="cm-btn cm-btn--secondary"
        href={`/roster?tab=timesheets&attendanceId=${record.id}`}
      >
        View attendance history
      </Link>
    </Card>
  )
}
