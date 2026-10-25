"use client"
import { useState, type CSSProperties } from "react"
import { useAdmin, Panel, Select } from "../ui/core"
import { Btn, Icon } from "../../staff/ui"
import {
  addDays,
  dayLabel,
  monthDays,
  moveMonth,
  nzDay,
  shiftOnDay,
  shiftTime,
} from "../../staff/roster/dates"
import { toNZDateTimeInput } from "@/lib/time"
import { managementAttendanceStatus } from "./adapter"
import { useWorkforceURL } from "./shared"
import type { Employee, House, Shift } from "../../staff/data/types"
const compactDay = (day: string, year = false) =>
  new Intl.DateTimeFormat("en-NZ", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    ...(year ? { year: "numeric" as const } : {}),
  }).format(new Date(`${day}T12:00:00Z`))
const COLORS = [
  "#1a6b7a",
  "#e8834a",
  "#3b82f6",
  "#7c5cbf",
  "#2a9d6f",
  "#d97706",
]
export default function RosterCalendar() {
  const { data: s } = useAdmin()
  const { change } = useWorkforceURL()
  return (
    <RosterCalendarView
      data={s}
      change={change}
      attendanceLabel={(sh) => managementAttendanceStatus(s, sh)}
    />
  )
}
export interface CalendarData {
  now: string
  shifts: Shift[]
  staff: Array<Pick<Employee, "id" | "name">>
  houses: Array<Pick<House, "id" | "name" | "status">>
}
interface CalendarProps {
  data: CalendarData
  change: (values: Record<string, string>) => void
  attendanceLabel: (shift: Shift) => string
  anchorDay?: string
  onAnchorChange?: (day: string) => void
}
export function RosterCalendarView({
  data: s,
  change,
  attendanceLabel,
  anchorDay,
  onAnchorChange,
}: CalendarProps) {
  const [view, setView] = useState("week"),
    [localAnchor, setLocalAnchor] = useState(nzDay(s.now)),
    [house, setHouse] = useState(""),
    [employee, setEmployee] = useState(""),
    [status, setStatus] = useState("scheduled")
  const anchor = anchorDay ?? localAnchor
  const setAnchor = (day: string) =>
    onAnchorChange ? onAnchorChange(day) : setLocalAnchor(day)
  const weekday = (new Date(`${anchor}T12:00:00Z`).getUTCDay() + 6) % 7,
    days = Array.from({ length: 7 }, (_, i) => addDays(anchor, i - weekday)),
    houses = s.houses.filter(
      (h) => (!house || house === h.id) && h.status !== "Inactive",
    ),
    shifts = s.shifts.filter(
      (sh) =>
        (!house || house === sh.houseId) &&
        (!employee || employee === sh.staffId) &&
        (!status ||
          (status === "cancelled"
            ? sh.status === "cancelled"
            : sh.status !== "cancelled")),
    )
  const color = (id: string) =>
    COLORS[[...id].reduce((n, c) => n + c.charCodeAt(0), 0) % COLORS.length]
  const move = (n: number) =>
    setAnchor(
      view === "month"
        ? `${moveMonth(anchor.slice(0, 7), n)}-01`
        : addDays(anchor, n * (view === "week" ? 7 : 1)),
    )
  const block = (sh: Shift, style?: CSSProperties) => (
    <button
      key={sh.id}
      className="ad-shift-block"
      style={{ ...style, borderLeftColor: color(sh.staffId) }}
      onClick={() => change({ shiftId: sh.id })}
    >
      <strong>{s.staff.find((e) => e.id === sh.staffId)?.name}</strong>
      <span>{shiftTime(sh.start, sh.end)}</span>
      <small>{sh.status === "cancelled" ? "Cancelled" : "Scheduled"}</small>
      <small>{attendanceLabel(sh)}</small>
    </button>
  )
  return (
    <Panel pad={false}>
      <div className="ad-cal-toolbar">
        <div className="ad-inline">
          <Btn
            size="sm"
            variant="secondary"
            onClick={() => setAnchor(nzDay(s.now))}
          >
            Today
          </Btn>
          <button
            className="ad-icon-sq"
            aria-label="Previous date range"
            onClick={() => move(-1)}
          >
            <Icon name="back" size={15} />
          </button>
          <button
            className="ad-icon-sq"
            aria-label="Next date range"
            onClick={() => move(1)}
          >
            <Icon name="chevron" size={15} />
          </button>
          <strong>
            {view === "week"
              ? `${compactDay(days[0])} – ${compactDay(days[6], true)}`
              : view === "month"
                ? anchor.slice(0, 7)
                : dayLabel(anchor)}
          </strong>
        </div>
        <div className="ad-inline">
          <Select
            label="House"
            value={house}
            onChange={setHouse}
            options={[
              { value: "", label: "All houses" },
              ...s.houses.map((h) => ({ value: h.id, label: h.name })),
            ]}
          />
          <Select
            label="Employee"
            value={employee}
            onChange={setEmployee}
            options={[
              { value: "", label: "All employees" },
              ...s.staff.map((e) => ({ value: e.id, label: e.name })),
            ]}
          />
          <Select
            label="Shift status"
            value={status}
            onChange={setStatus}
            options={[
              { value: "", label: "All statuses" },
              { value: "scheduled", label: "Scheduled" },
              { value: "cancelled", label: "Cancelled" },
            ]}
          />
          <div className="ad-seg">
            {["day", "week", "month"].map((v) => (
              <button
                key={v}
                className={view === v ? "active" : ""}
                aria-pressed={view === v}
                onClick={() => setView(v)}
              >
                {v[0].toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div
        className="ad-calendar-scroll"
        role="region"
        aria-label="Roster calendar"
        tabIndex={0}
      >
        {view === "week" ? (
          <div
            className="ad-week"
            style={{ gridTemplateColumns: "11rem repeat(7,minmax(0,1fr))" }}
          >
            <div className="ad-week-corner">House</div>
            {days.map((d) => (
              <div
                className={`ad-week-day ${d === nzDay(s.now) ? "today" : ""}`}
                key={d}
              >
                <span>{dayLabel(d).split(",")[0].slice(0, 3)}</span>
                <b>{d.slice(8)}</b>
              </div>
            ))}
            {houses.map((h) => [
              <div className="ad-week-house" key={h.id}>
                <strong>{h.name}</strong>
                <span>
                  {
                    shifts.filter(
                      (sh) =>
                        sh.houseId === h.id &&
                        days.some((d) => shiftOnDay(sh.start, sh.end, d)),
                    ).length
                  }{" "}
                  shifts
                </span>
              </div>,
              ...days.map((d) => (
                <div
                  key={h.id + d}
                  className={`ad-week-cell ${
                    d === nzDay(s.now) ? "today" : ""
                  }`}
                >
                  {shifts
                    .filter(
                      (sh) =>
                        sh.houseId === h.id && shiftOnDay(sh.start, sh.end, d),
                    )
                    .sort((a, b) => a.start.localeCompare(b.start))
                    .map((sh) => block(sh))}
                  <button
                    className="ad-add-slot"
                    aria-label={`Add shift at ${h.name} on ${d}`}
                    onClick={() =>
                      change({ action: "new", house: h.id, day: d })
                    }
                  >
                    <Icon name="plus" size={13} />
                  </button>
                </div>
              )),
            ])}
          </div>
        ) : view === "month" ? (
          <div className="ad-month">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <span className="ad-month-dow" key={d}>
                {d}
              </span>
            ))}
            {monthDays(anchor.slice(0, 7)).map((d) => {
              const list = shifts.filter((sh) =>
                shiftOnDay(sh.start, sh.end, d),
              )
              return (
                <button
                  key={d}
                  className={`ad-month-cell ${
                    d.slice(0, 7) !== anchor.slice(0, 7) ? "out" : ""
                  } ${d === nzDay(s.now) ? "today" : ""}`}
                  aria-label={`${dayLabel(d)}, ${list.length} shifts`}
                  onClick={() => {
                    setAnchor(d)
                    setView("day")
                  }}
                >
                  <b>{Number(d.slice(8))}</b>
                  <span>{list.length ? `${list.length} shifts` : ""}</span>
                  <div>
                    {list.slice(0, 4).map((sh) => (
                      <i
                        key={sh.id}
                        style={{ background: color(sh.staffId) }}
                      />
                    ))}
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="ad-day">
            <div className="ad-day-scale">
              <span />
              {Array.from({ length: 13 }, (_, i) => (
                <span key={i}>{String(i * 2).padStart(2, "0")}:00</span>
              ))}
            </div>
            {houses.map((h) => (
              <div className="ad-day-row" key={h.id}>
                <div className="ad-week-house">
                  <strong>{h.name}</strong>
                </div>
                <div className="ad-day-track">
                  {shifts
                    .filter(
                      (sh) =>
                        sh.houseId === h.id &&
                        shiftOnDay(sh.start, sh.end, anchor),
                    )
                    .map((sh) => {
                      const start =
                          nzDay(sh.start) < anchor
                            ? 0
                            : Number(
                                toNZDateTimeInput(sh.start).slice(11, 13),
                              ) +
                              Number(toNZDateTimeInput(sh.start).slice(14)) /
                                60,
                        end =
                          nzDay(sh.end) > anchor
                            ? 24
                            : Number(toNZDateTimeInput(sh.end).slice(11, 13)) +
                              Number(toNZDateTimeInput(sh.end).slice(14)) / 60
                      return block(sh, {
                        position: "relative",
                        marginLeft: `${(start / 24) * 100}%`,
                        width: `${((end - start) / 24) * 100}%`,
                      })
                    })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Panel>
  )
}
