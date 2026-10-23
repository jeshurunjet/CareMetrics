"use client"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useStaffData } from "../data/context"
import {
  myShifts,
  upcomingShifts,
  myHouses,
  highlightedShift,
} from "../data/selectors"
import { PageHeader, Banner, Empty, SectionTitle } from "../ui"
import Tabs from "../ui/Tabs"
import ShiftCard from "../ui/ShiftCard"
import ShiftDetail from "../ui/ShiftDetail"
import { getOwnShift, getOwnAttendance } from "./adapter"
import { nzDay, dayLabel, shiftOnDay } from "./dates"
import RosterCalendar from "./RosterCalendar"
import TeamSchedule from "./TeamSchedule"
import Timesheets from "./Timesheets"
import AttendanceDetails from "./AttendanceDetails"
import AttendanceCorrectionForm from "./AttendanceCorrectionForm"
import HouseFilter from "./HouseFilter"
export default function Roster() {
  const s = useStaffData(),
    router = useRouter(),
    params = useSearchParams(),
    tab = params.get("tab") || "roster",
    day =
      params.get("day") ||
      (params.get("month") ? `${params.get("month")}-01` : nzDay(s.now)),
    month = params.get("month") || day.slice(0, 7),
    house = params.get("house") || ""
  const change = (values: Record<string, string>) => {
    const q = new URLSearchParams(params.toString())
    Object.entries(values).forEach(([k, v]) => (v ? q.set(k, v) : q.delete(k)))
    router.push(`/roster?${q}`)
  }
  const shifts = myShifts(s).filter((sh) => !house || sh.houseId === house),
    upcoming = upcomingShifts(s).filter((sh) => !house || sh.houseId === house),
    selected = shifts.filter((sh) => shiftOnDay(sh.start, sh.end, day)),
    shiftId = params.get("shiftId"),
    attendanceId = params.get("attendanceId"),
    shift = shiftId ? getOwnShift(s, shiftId) : undefined,
    attendance = attendanceId ? getOwnAttendance(s, attendanceId) : undefined,
    action = params.get("action"),
    close = () => change({ shiftId: "", attendanceId: "", action: "" })
  return (
    <div className="cm-stack cm-roster">
      <PageHeader
        title="Roster & Timesheets"
        subtitle="Your shifts, your team's schedule and attendance history."
      />
      <nav aria-label="Roster breadcrumbs">
        <Link href="/dashboard">Dashboard</Link> /{" "}
        <Link href={`/roster?tab=${tab}`}>Roster & Timesheets</Link>
        {shift && " / Shift details"}
        {attendance &&
          ` / ${
            action === "correction"
              ? "Request correction"
              : "Attendance details"
          }`}
      </nav>
      <Tabs
        label="Roster sections"
        value={tab}
        onChange={(t) => router.push(`/roster?tab=${t}`)}
        tabs={[
          { id: "roster", label: "My roster", icon: "calendar" },
          { id: "team", label: "Team schedule", icon: "users" },
          { id: "timesheets", label: "My timesheets", icon: "clock" },
        ]}
      />
      <Banner tone="info">
        Development preview · fictional shifts and attendance, Pacific/Auckland.
        Real clock-in/out, GPS, permanent changes and production management
        services are not connected. Development decisions share this session.
        Requests reset on reload.
      </Banner>
      {action === "correction" && attendance ? (
        <AttendanceCorrectionForm
          key={attendance.id}
          attendance={attendance}
          returnHref={`/roster?tab=timesheets&attendanceId=${attendance.id}`}
        />
      ) : (
        <>
          {tab === "roster" && (
            <>
              <div className="cm-toolbar">
                <HouseFilter
                  value={house}
                  onChange={(h) => change({ house: h })}
                />
              </div>
              <div className="cm-two-col cm-two-col--roster">
                <RosterCalendar
                  month={month}
                  day={day}
                  now={s.now}
                  shifts={shifts}
                  onChange={(d, m) => change({ day: d, month: m })}
                />
                <div className="cm-stack">
                  <SectionTitle title={dayLabel(day)} />
                  {!selected.length ? (
                    <Empty icon="calendar" title="No shifts this day" />
                  ) : (
                    selected.map((sh) => (
                      <ShiftCard
                        key={sh.id}
                        shift={sh}
                        highlighted={highlightedShift(s)?.id === sh.id}
                        onClick={() => change({ shiftId: sh.id })}
                      />
                    ))
                  )}
                  <SectionTitle title="Upcoming" />
                  {!upcoming.length ? (
                    <Empty icon="calendar" title="No upcoming shifts" />
                  ) : (
                    upcoming.map((sh) => (
                      <ShiftCard
                        key={sh.id}
                        shift={sh}
                        highlighted={false}
                        onClick={() => change({ shiftId: sh.id })}
                      />
                    ))
                  )}
                </div>
              </div>
            </>
          )}
          {tab === "team" && (
            <TeamSchedule
              house={house || myHouses(s)[0]?.id || ""}
              day={day}
              onChange={(h, d) => change({ house: h, day: d })}
            />
          )}
          {tab === "timesheets" && <Timesheets />}
          {shift && <ShiftDetail shift={shift} onClose={close} />}
          {attendance && (
            <AttendanceDetails attendance={attendance} onClose={close} />
          )}
          {((shiftId && !shift) || (attendanceId && !attendance)) && (
            <Empty icon="shield" title="Record unavailable" />
          )}
        </>
      )}
    </div>
  )
}
