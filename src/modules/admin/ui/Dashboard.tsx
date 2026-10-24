"use client"
import { recordReviewSummary } from "../records/adapter"
import { correctionHref } from "../records/SubmittedRecords"
import { effectiveAttendance } from "../../staff/roster/effective"
import { managementAttendanceStatus } from "../workforce/adapter"
import Link from "next/link"
import { Avatar, Btn } from "@/modules/staff/ui"
import { PageHead, Panel, Stat, DataTable, Pill, useAdmin } from "./core"
import { dashboardSummary } from "../data/adapter"
import { formatTime, formatDateTime } from "@/lib/time"
export default function Dashboard() {
  const nav = useAdmin(),
    s = nav.data,
    t = dashboardSummary(s),
    documentation = recordReviewSummary(s, nav.role)
  const name = (id: string) =>
    s.staff.find((e) => e.id === id)?.name ??
    s.houses.find((h) => h.id === id)?.name ??
    s.clients.find((c) => c.id === id)?.name ??
    "Unavailable"
  const corrections = [
    ...s.corrections
      .filter((c) => c.status === "pending")
      .map((c) => ({
        id: c.id,
        title: "Documentation correction",
        sub: c.reason,
        href: correctionHref(c.id),
      })),
    ...s.attendanceCorrections
      .filter((c) => c.status === "pending")
      .map((c) => ({
        id: c.id,
        title: "Attendance correction",
        sub: c.reason,
        href: `/admin/roster?tab=corrections&correctionId=${c.id}`,
      })),
  ]
  const leave = s.leaveRequests
    .filter((l) => l.status === "pending")
    .map((l) => ({
      id: l.id,
      title: name(l.employeeId),
      sub: `${l.start} – ${l.end}`,
    }))
  const concerns = s.concerns
    .filter((c) => ["Submitted", "Under Review"].includes(c.status))
    .map((c) => ({
      id: c.id,
      title: c.title,
      sub: `${name(c.targetId)} · ${c.status}`,
      href: `/admin/concerns/${encodeURIComponent(c.id)}`,
    }))
  const issues = s.shifts
    .filter(
      (sh) =>
        sh.status !== "cancelled" &&
        sh.start < s.now &&
        Date.parse(sh.start) > Date.parse(s.now) - 3 * 86400000 &&
        !s.attendance.some(
          (a) => a.shiftId === sh.id && effectiveAttendance(s, a).clockOut,
        ),
    )
    .map((sh) => ({
      id: sh.id,
      title: `${name(sh.staffId)} · ${name(sh.houseId)}`,
      sub: "Incomplete or absent fictional attendance",
    }))
  const stats = [
    {
      label: "Active employees",
      value: t.activeEmployees,
      icon: "users",
      page: "employees",
    },
    { label: "Houses", value: t.houses, icon: "house", page: "houses" },
    { label: "Clients", value: t.clients, icon: "user", page: "clients" },
    {
      label: "Shifts today",
      value: t.today.length,
      icon: "calendar",
      page: "roster",
    },
    {
      label: "Open attendance (fictional)",
      value: t.clockedIn,
      icon: "clock",
      page: "roster",
    },
    {
      label: "Pending care-record corrections",
      value: documentation.pending,
      icon: "flag",
      page: "docs",
    },
    { label: "Pending leave", value: t.leave, icon: "umbrella", page: "leave" },
    {
      label: "Open concerns",
      value: t.concerns,
      icon: "alert",
      page: "notices",
    },
  ]
  return (
    <>
      <PageHead
        title={`Kia ora, ${s.staff.find((e) => e.id === (nav.role === "Manager" ? "m1" : "a1"))?.name.split(" ")[0] ?? "Administrator"}`}
        sub={`${new Intl.DateTimeFormat("en-NZ", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Pacific/Auckland" }).format(new Date(s.now))} · ${s.organisation?.name ?? "Fictional organisation"}`}
        actions={
          <>
            <Btn
              variant="secondary"
              icon="calendar"
              onClick={() => nav.go({ page: "roster" })}
            >
              Roster preview
            </Btn>
            <Btn icon="plus" onClick={() => nav.go({ page: "employee-form" })}>
              New employee
            </Btn>
          </>
        }
      />
      <div className="ad-stats">
        {stats.map((st, i) => (
          <Stat
            key={st.label}
            label={st.label}
            value={st.value}
            icon={st.icon}
            tone={
              i === 4
                ? "success"
                : i === 7
                  ? "danger"
                  : i > 4
                    ? "warning"
                    : "brand"
            }
            onClick={() =>
              nav.go({
                page: st.page,
                tab: st.page === "docs" ? "corrections" : undefined,
              })
            }
          />
        ))}
      </div>
      <div className="ad-grid-main">
        <Panel
          title="Today's shifts"
          pad={false}
          actions={
            <Btn
              size="sm"
              variant="ghost"
              onClick={() => nav.go({ page: "roster" })}
            >
              Roster calendar
            </Btn>
          }
        >
          <p className="ad-faint">
            {new Set(t.today.map((sh) => sh.staffId)).size} scheduled employees
            ·{" "}
            {
              s.attendanceCorrections.filter((c) => c.status === "pending")
                .length
            }{" "}
            pending attendance corrections
          </p>
          <DataTable
            rows={t.today}
            per={6}
            cols={[
              {
                key: "employee",
                label: "Employee",
                render: (r) => (
                  <span className="ad-cell-user">
                    <Avatar name={name(r.staffId)} size={28} />
                    <Link
                      className="ad-link"
                      href={`/admin/employees/${r.staffId}`}
                    >
                      {name(r.staffId)}
                    </Link>
                  </span>
                ),
              },
              {
                key: "house",
                label: "House",
                render: (r) => (
                  <Link className="ad-link" href={`/admin/houses/${r.houseId}`}>
                    {name(r.houseId)}
                  </Link>
                ),
              },
              {
                key: "start",
                label: "Start",
                render: (r) => formatTime(r.start),
              },
              { key: "end", label: "End", render: (r) => formatTime(r.end) },
              {
                key: "status",
                label: "Shift status",
                render: (r) =>
                  r.end <= s.now
                    ? "Completed"
                    : r.start <= s.now
                      ? "In Progress"
                      : "Scheduled",
              },
              {
                key: "attendance",
                label: "Attendance (fictional)",
                render: (r) => <Pill s={managementAttendanceStatus(s, r)} />,
              },
            ]}
            empty={
              <p className="ad-empty-inline">No shifts scheduled today.</p>
            }
          />
        </Panel>
        <Panel title="Recent development activity">
          <p className="ad-faint">
            Derived from existing submissions · not a production audit log.
          </p>
          <ul className="ad-activity">
            {[
              ...s.diary
                .filter((d) => d.submittedAt)
                .map((d) => ({
                  id: d.id,
                  date: d.submittedAt!,
                  title: d.title,
                  author: name(d.authorId),
                })),
              ...s.careRecords
                .filter((r) => r.submittedAt)
                .map((r) => ({
                  id: r.id,
                  date: r.submittedAt!,
                  title:
                    s.careTemplates.find((t) => t.id === r.templateId)?.name ??
                    "Care record",
                  author: name(r.authorId),
                })),
            ]
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 7)
              .map((a) => (
                <li key={a.id}>
                  <span className="ad-act-dot" />
                  <div>
                    <strong>{a.title}</strong>
                    <p>{a.author}</p>
                    <span>{formatDateTime(a.date)}</span>
                  </div>
                </li>
              ))}
          </ul>
        </Panel>
      </div>
      <Panel title="Documentation review summary">
        <Link className="ad-link" href="/admin/documentation?tab=records">
          {documentation.total} submitted documentation records
        </Link>
        <p>
          {documentation.pending} pending care-record corrections ·{" "}
          {s.attendanceCorrections.filter((c) => c.status === "pending").length}{" "}
          pending attendance corrections
        </p>
        <p>
          {documentation.requests.filter((x) => x.request.decision).length}{" "}
          reviewed documentation requests in this session
        </p>
      </Panel>
      <div className="ad-grid-4">
        {[
          {
            title: "Correction requests (care / attendance)",
            items: corrections,
            href: "/admin/documentation",
          },
          { title: "Leave requests", items: leave, href: "/admin/leave" },
          { title: "Concerns", items: concerns, href: "/admin/notifications" },
          { title: "Attendance issues", items: issues, href: "/admin/roster" },
        ].map((q) => (
          <Panel
            key={q.title}
            title={
              <>
                {q.title}
                <span className="ad-count">{q.items.length}</span>
              </>
            }
            actions={
              <Link className="ad-link" href={q.href}>
                View all
              </Link>
            }
          >
            {q.items.length ? (
              <ul className="ad-queue">
                {q.items.slice(0, 4).map((it) => (
                  <li key={it.id}>
                    <Link href={"href" in it ? String(it.href) : q.href}>
                      <div>
                        <strong>{it.title}</strong>
                        <span>{it.sub}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ad-empty-inline">Nothing waiting</p>
            )}
          </Panel>
        ))}
      </div>
    </>
  )
}
