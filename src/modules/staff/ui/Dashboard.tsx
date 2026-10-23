"use client"
import { useState } from "react"
import HouseCard from "./HouseCard"
import ClientCard from "./ClientCard"
import NotificationCard from "./NotificationCard"
import { useStaffData } from "../data/context"
import {
  me,
  myHouses,
  myClients,
  upcomingShifts,
  highlightedShift,
  isCurrent,
  visibleNotices,
  shiftStatus,
} from "../data/selectors"
import {
  formatDate as fmtDate,
  formatTime as fmtTime,
  dayNumber,
  weekday,
} from "@/lib/time"
import {
  useNav,
  PageHeader,
  Card,
  Btn,
  Status,
  Icon,
  Avatar,
  SectionTitle,
  Empty,
} from "./index"
export default function Home() {
  const s = useStaffData()
  const nav = useNav()
  const user = me(s)
  const houses = myHouses(s)
  const clients = myClients(s)
  const hl = highlightedShift(s)
  const active = false
  const shiftHouse = s.houses.find((h) => h.id === hl?.houseId)
  const [sel, setSel] = useState(shiftHouse?.id ?? houses[0]?.id)
  const [schedOpen, setSchedOpen] = useState(true)
  const upcoming = upcomingShifts(s).slice(0, 4)
  const coworkers = s.shifts
    .filter(
      (x) =>
        x.houseId === sel &&
        x.status !== "cancelled" &&
        x.staffId !== s.meId &&
        Date.parse(x.end) > Date.parse(s.now),
    )
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, 4)
  const notices = visibleNotices(s).slice(0, 3)

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        subtitle={`${houses.length} assigned houses · ${clients.length} clients`}
        actions={
          <Card
            className="cm-me-card"
            onClick={() => nav.go({ page: "profile" })}
          >
            <Avatar name={user.name} size={48} photo={user.photo} />
            <div className="cm-grow">
              <strong>{user.name}</strong>
              <span>
                {user.role} · {user.employeeId}
              </span>
              <small>{user.email}</small>
            </div>
            <span className="cm-me-cta">
              View profile
              <Icon name="chevron" size={14} />
            </span>
          </Card>
        }
      />

      {hl && shiftHouse && (
        <Card
          className={`cm-current ${active ? "cm-current--active" : ""}`}
          onClick={() => nav.go({ page: "clock" })}
        >
          <span className="cm-current-icon">
            <Icon name="clock" size={22} />
          </span>
          <div className="cm-grow">
            <span className="cm-eyebrow">
              {isCurrent(s, hl) ? "Current shift" : "Next shift"}
            </span>
            <strong>
              {fmtDate(hl.start)} · {fmtTime(hl.start)} – {fmtTime(hl.end)}
            </strong>
            <span>
              {shiftHouse.name} · {"Not clocked in · preview"}
            </span>
          </div>
          <Status tone={shiftStatus(s, hl).tone}>
            {shiftStatus(s, hl).label}
          </Status>
          <span className="cm-current-cta">
            {active ? "Manage" : "Clock in"}
            <Icon name="chevron" size={15} />
          </span>
        </Card>
      )}

      <div className="cm-dash-grid">
        <div className="cm-stack">
          <SectionTitle
            title="My houses"
            count={houses.length}
            action="All houses"
            onAction={() => nav.go({ page: "houses" })}
          />
          <div className="cm-house-strip">
            {houses.map((h) => (
              <HouseCard key={h.id} h={h} currentHouseId={shiftHouse?.id} />
            ))}
          </div>

          <SectionTitle
            title="My clients"
            count={clients.length}
            action="Search"
            onAction={() => nav.go({ page: "search" })}
          />
          <div className="cm-client-grid">
            {clients.map((c) => (
              <ClientCard
                key={c.id}
                c={c}
                houseName={s.houses.find((h) => h.id === c.houseId)?.name}
              />
            ))}
          </div>
        </div>

        <div className="cm-stack">
          <Card className="cm-panel">
            <button
              className="cm-collapsible"
              onClick={() => setSchedOpen((o) => !o)}
              aria-expanded={schedOpen}
            >
              <h2>My schedule</h2>
              <Icon name="down" size={17} />
            </button>
            {schedOpen && (
              <>
                {upcoming.map((sh) => (
                  <div key={sh.id} className="cm-mini-row">
                    <div className="cm-date-chip cm-date-chip--sm">
                      <b>{dayNumber(sh.start)}</b>
                      <span>{weekday(sh.start)}</span>
                    </div>
                    <div className="cm-grow">
                      <strong>
                        {fmtTime(sh.start)} – {fmtTime(sh.end)}
                      </strong>
                      <span>
                        {s.houses.find((h) => h.id === sh.houseId)?.name}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="cm-subhead">
                  <span>Coworkers at</span>
                  <select
                    className="cm-inline-select"
                    value={sel}
                    onChange={(e) => setSel(e.target.value)}
                    aria-label="Select house"
                  >
                    {houses.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>
                {coworkers.length === 0 ? (
                  <p className="cm-muted cm-pad">No coworkers scheduled.</p>
                ) : (
                  coworkers.map((c) => {
                    const st = s.staff.find((x) => x.id === c.staffId)!
                    return (
                      <div key={c.id} className="cm-mini-row">
                        <Avatar name={st.name} size={32} />
                        <div className="cm-grow">
                          <strong>{st.name}</strong>
                          <span>
                            {fmtDate(c.start)} · {fmtTime(c.start)}–
                            {fmtTime(c.end)}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
                <Btn
                  variant="ghost"
                  size="sm"
                  onClick={() => nav.go({ page: "roster", tab: "team" })}
                >
                  Team schedule
                  <Icon name="chevron" size={14} />
                </Btn>
              </>
            )}
          </Card>

          <Card className="cm-panel">
            <SectionTitle
              title="My Leave"
              action="View leave"
              onAction={() => nav.go({ page: "leave" })}
            />
            <p className="cm-muted">
              Review your own leave requests or request leave.
            </p>
          </Card>

          <Card className="cm-panel">
            <SectionTitle
              title="Notifications"
              action="View all"
              onAction={() => nav.go({ page: "notifications" })}
            />
            {notices.length === 0 ? (
              <Empty icon="bell" title="You're all caught up" />
            ) : (
              notices.map((n) => <NotificationCard key={n.id} n={n} />)
            )}
          </Card>
        </div>
      </div>
    </>
  )
}
