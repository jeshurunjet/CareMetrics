"use client"
import Link from "next/link"
import { useState } from "react"
import { useStaffData } from "../data/context"
import {
  attendanceForShift,
  attendanceStatus,
  getAttendanceCorrections,
  queryTimesheets,
  recordedHours,
} from "./adapter"
import { durationText, shiftTime } from "./dates"
import { formatDate, formatTime } from "@/lib/time"
import { Card, Empty, Status } from "../ui"
import Pagination from "../ui/Pagination"
import HouseFilter from "./HouseFilter"
export default function Timesheets() {
  const s = useStaffData(),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [house, setHouse] = useState(""),
    [page, setPage] = useState(1)
  const history = queryTimesheets(s, from, to, house, page),
    error = !!(from && to && from > to)
  const attendance = history.rows.flatMap((sh) => {
    const a = attendanceForShift(s, sh.id)
    return a ? [a] : []
  })
  return (
    <div className="cm-stack">
      <div className="cm-toolbar">
        <label className="cm-filter cm-roster-date-filter">
          From
          <input
            aria-label="Timesheets from"
            className="cm-input"
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value)
              setPage(1)
            }}
          />
        </label>
        <label className="cm-filter cm-roster-date-filter">
          To
          <input
            aria-label="Timesheets to"
            className="cm-input"
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value)
              setPage(1)
            }}
          />
        </label>
        <HouseFilter
          value={house}
          onChange={(h) => {
            setHouse(h)
            setPage(1)
          }}
        />
      </div>
      {error && (
        <p role="alert" className="cm-error">
          End date must be on or after start date.
        </p>
      )}
      <div className="cm-stat-row">
        <Card className="cm-stat">
          <span>Recorded hours</span>
          <strong>
            {attendance.reduce((n, a) => n + recordedHours(a), 0).toFixed(1)}
          </strong>
        </Card>
        <Card className="cm-stat">
          <span>Shifts worked</span>
          <strong>
            {attendance.filter((a) => a.clockIn && a.clockOut).length}
          </strong>
        </Card>
        <Card className="cm-stat">
          <span>Corrections pending</span>
          <strong>
            {
              attendance.filter((a) =>
                getAttendanceCorrections(s, a.id).some(
                  (c) => c.status === "pending",
                ),
              ).length
            }
          </strong>
        </Card>
      </div>
      <p className="cm-muted">
        Fictional recorded attendance · scheduled hours are separate. No payroll
        approval. Scroll horizontally for all columns.
      </p>
      {!history.total ? (
        <Empty icon="clock" title="No timesheets in this range" />
      ) : (
        <>
          <div
            className="cm-table-wrap cm-timesheet-table"
            tabIndex={0}
            role="region"
            aria-label="My timesheets table, scroll horizontally"
          >
            <table className="cm-table">
              <caption className="sr-only">
                Own shifts and fictional recorded attendance, newest first
              </caption>
              <thead>
                <tr>
                  {[
                    "Date",
                    "House",
                    "Rostered",
                    "Clock in",
                    "Clock out",
                    "Duration",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th key={h} scope="col">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.items.map((sh) => {
                  const a = attendanceForShift(s, sh.id),
                    correction = a
                      ? getAttendanceCorrections(s, a.id)[0]
                      : undefined
                  return (
                    <tr key={sh.id} data-timesheet-shift={sh.id}>
                      <th scope="row">{formatDate(sh.start)}</th>
                      <td>{s.houses.find((h) => h.id === sh.houseId)?.name}</td>
                      <td>{shiftTime(sh.start, sh.end)}</td>
                      <td>{a?.clockIn ? formatTime(a.clockIn) : "—"}</td>
                      <td>{a?.clockOut ? formatTime(a.clockOut) : "—"}</td>
                      <td>{durationText(a?.clockIn, a?.clockOut)}</td>
                      <td>
                        <Status
                          tone={
                            attendanceStatus(s, sh.id) === "Missing Clock-out"
                              ? "warning"
                              : "neutral"
                          }
                        >
                          {attendanceStatus(s, sh.id)}
                        </Status>
                        {correction && (
                          <span className="cm-muted">
                            {correction.status === "pending"
                              ? "Correction Pending Review"
                              : correction.status === "approved"
                                ? correction.decision
                                  ? "Correction Approved · development decision"
                                  : "Correction Approved · fixture"
                                : correction.decision
                                  ? "Correction Rejected · development decision"
                                  : "Correction Rejected · fixture"}
                          </span>
                        )}
                      </td>
                      <td>
                        <Link
                          className="cm-btn cm-btn--ghost cm-btn--sm"
                          href={
                            a
                              ? `/roster?tab=timesheets&attendanceId=${a.id}`
                              : `/roster?tab=timesheets&shiftId=${sh.id}`
                          }
                        >
                          View details
                          <span className="sr-only">
                            {" "}
                            for {formatDate(sh.start)} · {sh.id}
                          </span>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            total={history.total}
            page={history.page}
            per={6}
            onChange={setPage}
          />
        </>
      )}
    </div>
  )
}
