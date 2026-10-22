"use client"
// TODO: clock-out location policy still requires organisational sign-off.
import { useEffect, useRef, useState } from "react"
import { useStaffData, useUpdateStaffData } from "../data/context"
import {
  me,
  upcomingShifts,
  highlightedShift,
  isCurrent,
  shiftStatus,
} from "../data/selectors"
import type { Shift } from "../data/types"
import { formatDate as fmtDate, formatTime as fmtTime } from "@/lib/time"
import {
  useNav,
  PageHeader,
  Btn,
  Status,
  Icon,
  Spinner,
  Empty,
  SectionTitle,
} from "./index"
import ShiftCard from "./ShiftCard"
import ShiftDetail from "./ShiftDetail"
import PreviewMap from "./PreviewMap"
export default function ClockIn() {
  const s = useStaffData()
  const update = useUpdateStaffData()
  const nav = useNav()
  const user = me(s)
  const hl = highlightedShift(s)
  const upcoming = upcomingShifts(s).slice(0, 3)
  const house = s.houses.find((h) => h.id === hl?.houseId)
  const [gps, setGps] = useState<"unavailable" | "denied" | "checking">(
    "unavailable",
  )
  const clockedIn = !!s.demoAttendance
  const setClockedIn = (value: boolean) =>
    update((prev) => ({
      ...prev,
      demoAttendance:
        value && hl ? { employeeId: prev.meId, shiftId: hl.id } : null,
    }))
  const [detail, setDetail] = useState<Shift | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )
  const retry = () => {
    setGps("checking")
    timer.current = setTimeout(() => setGps("unavailable"), 700)
  }
  if (!hl || !house)
    return (
      <>
        <PageHeader title={`Kia ora, ${user.name.split(" ")[0]}`} />
        <Empty
          icon="calendar"
          title="No upcoming shifts"
          text="No shifts are assigned in this demonstration."
        />
        <Btn onClick={() => nav.go({ page: "home" })}>
          Continue to dashboard
        </Btn>
      </>
    )
  const eligible = isCurrent(s, hl)
  const st = shiftStatus(s, hl)
  const hour = Number(
    new Intl.DateTimeFormat("en-NZ", {
      timeZone: "Pacific/Auckland",
      hour: "numeric",
      hour12: false,
    }).format(new Date(s.now)),
  )
  return (
    <>
      <PageHeader
        eyebrow={fmtDate(s.now)}
        title={`${
          hour < 12 ? "Mōrena" : "Kia ora"
        }, ${user.name.split(" ")[0]}`}
        subtitle="Review your shift and record your attendance."
        actions={
          <Btn
            variant="secondary"
            icon="chevron"
            onClick={() => nav.go({ page: "home" })}
            className="cm-hide-mobile"
          >
            Continue to dashboard
          </Btn>
        }
      />

      <div className="cm-clock-grid">
        <section
          className={`cm-shift-hero ${
            clockedIn ? "cm-shift-hero--active" : ""
          }`}
          aria-label="Highlighted shift"
        >
          <div className="cm-shift-hero-top">
            <span className="cm-eyebrow">
              {eligible ? "Current shift" : "Next shift"}
            </span>
            <Status tone={st.tone}>
              {clockedIn ? "Demo clocked in" : st.label}
            </Status>
          </div>
          <div className="cm-shift-hero-time">
            <strong>
              {fmtTime(hl.start)} – {fmtTime(hl.end)}
            </strong>
            <span>{fmtDate(hl.start)}</span>
          </div>
          <dl className="cm-shift-facts">
            <div>
              <dt>
                <Icon name="house" size={15} />
                House
              </dt>
              <dd>{house.name}</dd>
            </div>
            <div>
              <dt>
                <Icon name="pin" size={15} />
                Address
              </dt>
              <dd>{house.address}</dd>
            </div>
            <div>
              <dt>
                <Icon name="user" size={15} />
                Assigned by
              </dt>
              <dd>{hl.assignedBy}</dd>
            </div>
            {clockedIn && (
              <div>
                <dt>
                  <Icon name="clock" size={15} />
                  Demo only
                </dt>
                <dd>No attendance recorded</dd>
              </div>
            )}
          </dl>

          <div
            className={`cm-gps cm-gps--${
              gps === "checking" ? "info" : "warning"
            }`}
          >
            {gps === "checking" ? (
              <Spinner label="Preview loading" />
            ) : (
              <Icon name="alert" size={18} />
            )}
            <div>
              <strong>
                {gps === "denied"
                  ? "Location access denied · preview"
                  : gps === "checking"
                    ? "Previewing location check…"
                    : "Location unavailable · preview"}
              </strong>
              <p>
                {gps === "denied"
                  ? "This demonstrates the permission-denied state. No browser permission was requested."
                  : "GPS verification is not implemented. No location has been requested or verified."}
              </p>
            </div>
          </div>
          {clockedIn ? (
            <Btn variant="danger" size="lg" block icon="logout" disabled>
              Clock out unavailable
            </Btn>
          ) : (
            <Btn size="lg" block icon="clock" disabled>
              Clock in unavailable
            </Btn>
          )}
          <p className="cm-hint">
            <Icon name="info" size={14} />
            Attendance backend and location policy pending. No attendance will
            be recorded.
          </p>
          <div className="cm-gps-help">
            <Btn
              variant="secondary"
              icon="refresh"
              onClick={retry}
              disabled={gps === "checking"}
            >
              Retry location check
            </Btn>
            <p>
              Still having trouble? Contact management: <b>{house.manager}</b>.
              Contact details are not configured in this fictional fixture.
            </p>
          </div>
        </section>

        <section className="cm-map-card" aria-label="Location verification map">
          <div className="cm-map">
            <PreviewMap house={house} />
          </div>
          <div className="cm-map-legend">
            <span>
              <i className="cm-legend-house" />
              Demonstration house
            </span>
            <span>No device location</span>
          </div>
          <div className="cm-sim" aria-label="Development location preview">
            <span>
              <Icon name="layers" size={14} />
              Development preview · no GPS or attendance writes
            </span>
            <div>
              <button
                className={gps === "unavailable" ? "active" : ""}
                onClick={() => setGps("unavailable")}
              >
                Unavailable location
              </button>
              <button
                className={gps === "denied" ? "active" : ""}
                onClick={() => setGps("denied")}
              >
                Permission denied
              </button>
              <button
                className={clockedIn ? "active" : ""}
                aria-pressed={clockedIn}
                onClick={() => setClockedIn(!clockedIn)}
              >
                Demo active attendance
              </button>
            </div>
          </div>
        </section>
      </div>

      <SectionTitle
        title="Upcoming shifts"
        action="View full roster"
        onAction={() => nav.go({ page: "roster" })}
      />
      <div className="cm-list">
        {upcoming.map((sh) => (
          <ShiftCard
            key={sh.id}
            shift={sh}
            highlighted={sh.id === hl.id}
            onClick={() => setDetail(sh)}
          />
        ))}
      </div>
      <div className="cm-sticky-cta">
        <Btn
          variant={clockedIn ? "primary" : "secondary"}
          block
          size="lg"
          onClick={() => nav.go({ page: "home" })}
        >
          Continue to dashboard
          <Icon name="chevron" size={17} />
        </Btn>
      </div>

      {detail && <ShiftDetail shift={detail} onClose={() => setDetail(null)} />}
    </>
  )
}
