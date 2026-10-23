"use client"
import { useState } from "react"
import { useAdmin, Panel } from "../ui/core"
import { Btn } from "../../staff/ui"
import { monthDays, moveMonth, nzDay, dayLabel } from "../../staff/roster/dates"
import { leaveTypeName, leaveStatusLabel } from "../../staff/leave/adapter"
import type { LeaveRequest } from "../../staff/leave/types"
import { useWorkforceURL } from "./shared"
export default function LeaveCalendar({ rows }: { rows: LeaveRequest[] }) {
  const { data: s } = useAdmin(),
    { change } = useWorkforceURL("/admin/leave"),
    [month, setMonth] = useState(nzDay(s.now).slice(0, 7)),
    [pending, setPending] = useState(false)
  return (
    <Panel pad={false}>
      <div className="ad-cal-toolbar">
        <div className="ad-inline">
          <Btn
            variant="secondary"
            onClick={() => setMonth(moveMonth(month, -1))}
          >
            Previous month
          </Btn>
          <Btn
            variant="secondary"
            onClick={() => setMonth(nzDay(s.now).slice(0, 7))}
          >
            Today
          </Btn>
          <strong>{month}</strong>
          <Btn
            variant="secondary"
            onClick={() => setMonth(moveMonth(month, 1))}
          >
            Next month
          </Btn>
        </div>
        <label>
          <input
            type="checkbox"
            checked={pending}
            onChange={(e) => setPending(e.target.checked)}
          />{" "}
          Include Pending Review
        </label>
      </div>
      <div className="ad-month ad-leave-calendar">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <span className="ad-month-dow" key={d}>
            {d}
          </span>
        ))}
        {monthDays(month).map((d) => (
          <div
            key={d}
            className={`ad-month-cell ${d.slice(0, 7) !== month ? "out" : ""}`}
            aria-label={dayLabel(d)}
          >
            <b>{Number(d.slice(8))}</b>
            {rows
              .filter(
                (l) =>
                  (l.status === "approved" ||
                    (pending && l.status === "pending")) &&
                  l.start <= d &&
                  d <= l.end,
              )
              .map((l) => (
                <button
                  className={`ad-leave-entry ${l.status}`}
                  key={l.id}
                  onClick={() => change({ requestId: l.id })}
                >
                  {s.staff.find((e) => e.id === l.employeeId)?.name}
                  <small>
                    {leaveTypeName(s, l.typeId)} · {leaveStatusLabel(l.status)}
                  </small>
                </button>
              ))}
          </div>
        ))}
      </div>
    </Panel>
  )
}
