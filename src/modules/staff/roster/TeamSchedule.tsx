"use client"
import { useStaffData } from "../data/context"
import { Avatar, Btn, Empty, SectionTitle, Status } from "../ui"
import { getTeamSchedule } from "./adapter"
import { addDays, dayLabel, shiftTime } from "./dates"
import HouseFilter from "./HouseFilter"
export default function TeamSchedule({
  house,
  day,
  onChange,
}: {
  house: string
  day: string
  onChange: (house: string, day: string) => void
}) {
  const s = useStaffData(),
    rows = getTeamSchedule(s, house, day)
  return (
    <div className="cm-stack">
      <div className="cm-toolbar">
        <HouseFilter
          all={false}
          value={house}
          onChange={(h) => onChange(h, day)}
        />
        <label className="cm-filter cm-roster-date-filter">
          Schedule date
          <input
            aria-label="Schedule date"
            className="cm-input"
            type="date"
            value={day}
            onChange={(e) => e.target.value && onChange(house, e.target.value)}
          />
        </label>
      </div>
      <div className="cm-row-between cm-roster-day-nav">
        <Btn
          variant="secondary"
          onClick={() => onChange(house, addDays(day, -1))}
        >
          Previous day
        </Btn>
        <Btn
          variant="secondary"
          onClick={() => onChange(house, addDays(day, 1))}
        >
          Next day
        </Btn>
      </div>
      <SectionTitle title={dayLabel(day)} />
      <details open className="cm-team-group">
        <summary>
          {s.houses.find((h) => h.id === house)?.name} · {rows.length} shifts
        </summary>
        {!rows.length ? (
          <Empty icon="users" title="No team shifts this day" />
        ) : (
          <div
            className="cm-table-wrap"
            role="region"
            aria-label="Team schedule table, scroll horizontally"
            tabIndex={0}
          >
            <table className="cm-table">
              <caption className="sr-only">
                Operational shifts for the selected assigned house
              </caption>
              <thead>
                <tr>
                  <th scope="col">Employee</th>
                  <th scope="col">Shift · Pacific/Auckland</th>
                  <th scope="col">House</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((sh) => (
                  <tr
                    key={sh.id}
                    className={sh.employeeId === s.meId ? "cm-row-me" : ""}
                  >
                    <th scope="row">
                      <span className="cm-cell-user">
                        <Avatar name={sh.employeeName} size={28} />
                        {sh.employeeName}
                        {sh.employeeId === s.meId && " (you)"}
                      </span>
                    </th>
                    <td>{shiftTime(sh.start, sh.end)}</td>
                    <td>{s.houses.find((h) => h.id === sh.houseId)?.name}</td>
                    <td>
                      <Status tone={sh.state.tone}>{sh.state.label}</Status>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </details>
      <p className="cm-muted">
        Operational schedule only. Coworker attendance, GPS and personnel
        details are not shown. Scroll tables horizontally for all columns.
      </p>
    </div>
  )
}
