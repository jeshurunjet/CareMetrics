"use client"
import { OwnAttendanceSummary } from "../attendance/AttendanceHistoryView"
import ClockInControl from "../attendance/ClockInControl"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  PageHeader,
  Btn,
  Status,
  Icon,
  Empty,
  SectionTitle,
  Modal,
  Card,
  Banner,
} from "@/modules/staff/ui"
import Tabs from "@/modules/staff/ui/Tabs"
import { ShiftCardView } from "@/modules/staff/ui/ShiftCard"
import RosterCalendar from "@/modules/staff/roster/RosterCalendar"
import {
  shiftTime,
  durationText,
  dayLabel,
  shiftOnDay,
} from "@/modules/staff/roster/dates"
import { formatDate, formatTime } from "@/lib/time"
import { shiftPresentation, scheduleStatus } from "./presentation"
import type { ShiftRead, StaffSchedule } from "./types"
interface Props {
  data: StaffSchedule
  view: "shifts" | "roster"
  tab?: string
}
export default function StaffScheduleView({
  data,
  view,
  tab = "roster",
}: Props) {
  const router = useRouter(),
    params = useSearchParams(),
    base = view === "shifts" ? "/shift-check" : "/roster"
  const change = (patch: Record<string, string>) => {
    const q = new URLSearchParams(params.toString())
    for (const [key, value] of Object.entries(patch))
      if (value) q.set(key, value)
      else q.delete(key)
    router.push(base + (q.size ? "?" + q.toString() : ""))
  }
  const highlighted = data.activeAttendanceShift ?? data.upcoming[0],
    selected = data.shifts.filter((s) =>
      shiftOnDay(s.startsAt, s.endsAt, data.day),
    ),
    house = params.get("house") ?? ""
  const cards = (rows: ShiftRead[]) =>
    rows.map((row) => (
      <ShiftCardView
        key={row.id}
        shift={shiftPresentation(row)}
        houseName={row.houseName}
        status={scheduleStatus(row, data.now)}
        attendanceLabel={
          row.clockIn?.attendance
            ? `${
                row.clockIn.attendance.clockOut ? "Clocked Out" : "Clocked In"
              } · ${formatTime(row.clockIn.attendance.clockOut ?? row.clockIn.attendance.clockIn)}`
            : "Attendance unavailable · scheduled time only"
        }
        highlighted={row.id === highlighted?.id}
        onClick={() => change({ shiftId: row.id })}
      />
    ))
  return (
    <>
      <PageHeader
        title={
          view === "shifts"
            ? `Kia ora, ${data.employeeName.split(" ")[0]}`
            : "Roster & Timesheets"
        }
        subtitle={
          view === "shifts"
            ? "Review your shifts and attendance. Continue without clocking in at any time."
            : "Your own assigned shifts · Pacific/Auckland."
        }
        actions={
          view === "shifts" ? (
            <Link
              href="/dashboard"
              className="cm-btn cm-btn--secondary cm-hide-mobile"
            >
              Continue to dashboard
            </Link>
          ) : undefined
        }
      />
      {view === "shifts" &&
        data.ownAttendanceSummary &&
        data.ownAttendanceSummary.shiftId !== highlighted?.id && (
          <OwnAttendanceSummary record={data.ownAttendanceSummary} />
        )}
      {view === "shifts" ? (
        <>
          {highlighted ? (
            <div className="cm-clock-grid">
              <section className="cm-shift-hero" aria-label="Highlighted shift">
                <div className="cm-shift-hero-top">
                  <span className="cm-eyebrow">
                    {data.activeAttendanceShift
                      ? "Recorded clock-in"
                      : scheduleStatus(highlighted, data.now).label ===
                          "Current"
                        ? "Current shift"
                        : "Next shift"}
                  </span>
                  <Status tone={scheduleStatus(highlighted, data.now).tone}>
                    {scheduleStatus(highlighted, data.now).label}
                  </Status>
                </div>
                <div className="cm-shift-hero-time">
                  <strong>
                    {formatTime(highlighted.startsAt)} –{" "}
                    {formatTime(highlighted.endsAt)}
                  </strong>
                  <span>{formatDate(highlighted.startsAt)}</span>
                </div>
                <dl className="cm-shift-facts">
                  <div>
                    <dt>
                      <Icon name="house" size={15} />
                      House
                    </dt>
                    <dd>{highlighted.houseName}</dd>
                  </div>
                  <div>
                    <dt>
                      <Icon name="pin" size={15} />
                      Address
                    </dt>
                    <dd>{highlighted.address}</dd>
                  </div>
                  <div>
                    <dt>
                      <Icon name="user" size={15} />
                      Assigned by
                    </dt>
                    <dd>{highlighted.assignedBy ?? "Not recorded"}</dd>
                  </div>
                  <div>
                    <dt>Scheduled end</dt>
                    <dd>
                      {formatDate(highlighted.endsAt)} ·{" "}
                      {formatTime(highlighted.endsAt)}
                    </dd>
                  </div>
                </dl>
                <ClockInControl
                  key={highlighted.id}
                  shiftId={highlighted.id}
                  houseName={highlighted.houseName}
                  state={highlighted.clockIn}
                />
                <Btn
                  variant="secondary"
                  onClick={() => change({ shiftId: highlighted.id })}
                >
                  View shift details
                </Btn>
              </section>
              <section className="cm-map-card" aria-label="House location">
                <div className="cm-map">
                  <Empty
                    icon="pin"
                    title="Live location not shown"
                    text={highlighted.address}
                  />
                </div>
                <div className="cm-map-legend">
                  <span>Assigned house</span>
                  <span>No device location</span>
                </div>
                <Banner tone="info">
                  Location is collected only when you choose to clock in. No
                  live device location is shown on this page.
                </Banner>
              </section>
            </div>
          ) : (
            <Empty
              icon="calendar"
              title="No upcoming shifts"
              text="No active scheduled shifts are assigned to your account."
            />
          )}
          <SectionTitle
            title="Upcoming shifts"
            action="View full roster"
            onAction={() => router.push("/roster")}
          />
          <div className="cm-list">{cards(data.upcoming)}</div>
          <div className="cm-sticky-cta">
            <Link
              href="/dashboard"
              className="cm-btn cm-btn--secondary cm-btn--lg cm-btn--block"
            >
              Continue to dashboard
              <Icon name="chevron" size={17} />
            </Link>
          </div>
        </>
      ) : (
        <div className="cm-stack cm-roster">
          <nav aria-label="Roster breadcrumbs">
            <Link href="/dashboard">Dashboard</Link> /{" "}
            <Link href="/roster">Roster & Timesheets</Link>
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
            Your schedule · Pacific/Auckland. Scheduled hours do not prove
            attendance. Clock-in and clock-out follow configured policy. Payroll
            and approvals remain unavailable.
          </Banner>
          {tab !== "roster" ? (
            <Empty
              title="Future Development"
              text="Team schedules and full timesheet services are not enabled in this phase."
            />
          ) : (
            <>
              <div className="cm-toolbar">
                <label>
                  House{" "}
                  <select
                    className="cm-input"
                    aria-label="House"
                    value={house}
                    onChange={(e) => change({ house: e.target.value })}
                  >
                    <option value="">All assigned houses</option>
                    {data.houses.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="cm-two-col cm-two-col--roster">
                <RosterCalendar
                  month={data.month}
                  day={data.day}
                  now={data.now}
                  shifts={data.shifts.map(shiftPresentation)}
                  onChange={(day, month) => change({ day, month })}
                />
                <div className="cm-stack">
                  <SectionTitle title={dayLabel(data.day)} />
                  {selected.length ? (
                    cards(selected)
                  ) : (
                    <Empty icon="calendar" title="No shifts this day" />
                  )}
                  <SectionTitle title="Upcoming" />
                  {data.upcoming.length ? (
                    cards(data.upcoming)
                  ) : (
                    <Empty title="No upcoming shifts" />
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
      {data.detail && (
        <StaffShiftDetail
          shift={data.detail}
          now={data.now}
          onClose={() => change({ shiftId: "" })}
        />
      )}
    </>
  )
}
interface DetailProps {
  shift: ShiftRead
  now: string
  onClose: () => void
}
export function StaffShiftDetail({ shift, now, onClose }: DetailProps) {
  const router = useRouter(),
    status = scheduleStatus(shift, now)
  return (
    <Modal
      title="Shift details"
      subtitle={`${formatDate(shift.startsAt)} · ${shiftTime(shift.startsAt, shift.endsAt)}`}
      onClose={onClose}
      footer={
        <Btn
          variant="secondary"
          onClick={() => router.push(`/houses/${shift.houseId}`)}
        >
          Open house
        </Btn>
      }
    >
      <dl className="cm-dl">
        {[
          ["Shift ID", shift.id],
          ["Employee", shift.employeeName],
          ["House", shift.houseName],
          ["Address", shift.address],
          ["Assigned by", shift.assignedBy ?? "Not recorded"],
          ["Scheduled duration", durationText(shift.startsAt, shift.endsAt)],
          [
            "Clock in / out",
            shift.clockIn?.attendance
              ? `Clocked In · ${formatDate(shift.clockIn.attendance.clockIn)} ${formatTime(shift.clockIn.attendance.clockIn)}`
              : "Clock-out unavailable · no recorded clock-in",
          ],
        ].map(([key, value]) => (
          <div key={key}>
            <dt>{key}</dt>
            <dd>{value}</dd>
          </div>
        ))}
        <div>
          <dt>Status</dt>
          <dd>
            <Status tone={status.tone}>{status.label}</Status>
          </dd>
        </div>
        {shift.notes && (
          <div className="cm-dl-full">
            <dt>Shift notes</dt>
            <dd>{shift.notes}</dd>
          </div>
        )}
      </dl>
      <ClockInControl
        key={shift.id}
        shiftId={shift.id}
        houseName={shift.houseName}
        state={shift.clockIn}
      />
    </Modal>
  )
}
export function ScheduleSummary({ data }: { data: StaffSchedule }) {
  const router = useRouter()
  const rows =
    data.activeAttendanceShift &&
    !data.upcoming.some((row) => row.id === data.activeAttendanceShift!.id)
      ? [data.activeAttendanceShift, ...data.upcoming]
      : data.upcoming
  return (
    <Card className="cm-panel">
      <SectionTitle
        title="My schedule"
        action="My Shifts"
        onAction={() => router.push("/shift-check")}
      />
      {rows.length ? (
        rows.map((row) => (
          <ShiftCardView
            key={row.id}
            shift={shiftPresentation(row)}
            houseName={row.houseName}
            status={scheduleStatus(row, data.now)}
            attendanceLabel={
              row.clockIn?.attendance
                ? `${
                    row.clockIn.attendance.clockOut
                      ? "Clocked Out"
                      : "Clocked In"
                  } · ${formatTime(row.clockIn.attendance.clockOut ?? row.clockIn.attendance.clockIn)}`
                : "Scheduled only · attendance unavailable"
            }
            highlighted={
              row.id === (data.activeAttendanceShift ?? data.upcoming[0])?.id
            }
            onClick={() => router.push(`/roster?shiftId=${row.id}`)}
          />
        ))
      ) : (
        <p className="cm-muted">No upcoming shifts.</p>
      )}
    </Card>
  )
}
