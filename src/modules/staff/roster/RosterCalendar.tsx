"use client"
import { useRef } from "react"
import { Card, Icon } from "../ui"
import type { Shift } from "../data/types"
import {
  addDays,
  dayLabel,
  monthDays,
  moveMonth,
  nzDay,
  shiftOnDay,
} from "./dates"
export default function RosterCalendar({
  month,
  day,
  now,
  shifts,
  onChange,
}: {
  month: string
  day: string
  now: string
  shifts: Shift[]
  onChange: (day: string, month: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <Card className="cm-panel cm-roster-calendar">
      <div className="cm-cal-head">
        <button
          aria-label="Previous month"
          onClick={() => {
            const next = moveMonth(month, -1)
            onChange(`${next}-01`, next)
          }}
        >
          <Icon name="back" size={16} />
        </button>
        <strong aria-live="polite">
          {new Intl.DateTimeFormat("en-NZ", {
            timeZone: "UTC",
            month: "long",
            year: "numeric",
          }).format(new Date(`${month}-01T12:00:00Z`))}
        </strong>
        <button
          aria-label="Next month"
          onClick={() => {
            const next = moveMonth(month, 1)
            onChange(`${next}-01`, next)
          }}
        >
          <Icon name="chevron" size={16} />
        </button>
      </div>
      <div
        className="cm-cal"
        ref={ref}
        role="group"
        aria-label="Roster calendar"
      >
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <span key={d} className="cm-cal-dow" aria-label={d}>
            {d[0]}
          </span>
        ))}
        {monthDays(month).map((date) => {
          const count = shifts.filter((sh) =>
            shiftOnDay(sh.start, sh.end, date),
          ).length
          return (
            <button
              key={date}
              data-date={date}
              aria-label={`${dayLabel(date)}, ${count} shifts`}
              aria-pressed={day === date}
              aria-current={nzDay(now) === date ? "date" : undefined}
              tabIndex={day === date ? 0 : -1}
              className={`${date.slice(0, 7) !== month ? "out" : ""} ${
                day === date ? "sel" : ""
              } ${nzDay(now) === date ? "today" : ""}`}
              onClick={() => onChange(date, date.slice(0, 7))}
              onKeyDown={(e) => {
                const delta: Record<string, number> = {
                  ArrowLeft: -1,
                  ArrowRight: 1,
                  ArrowUp: -7,
                  ArrowDown: 7,
                }
                if (e.key in delta) {
                  e.preventDefault()
                  const next = addDays(date, delta[e.key])
                  onChange(next, next.slice(0, 7))
                  requestAnimationFrame(() =>
                    ref.current
                      ?.querySelector<HTMLButtonElement>(
                        `[data-date="${next}"]`,
                      )
                      ?.focus(),
                  )
                }
              }}
            >
              {Number(date.slice(-2))}
              {count > 0 && <i aria-hidden="true" />}
            </button>
          )
        })}
      </div>
    </Card>
  )
}
