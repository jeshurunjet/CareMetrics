"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  PageHead,
  SubTabs,
  Panel,
  KV,
  Select,
  Filters,
  SearchInput,
  DataTable,
  useAdmin,
} from "../ui/core"
import { Banner, Btn, Empty } from "../../staff/ui"
import developmentEvents from "../governance/audit"
import type { DevelopmentEvent } from "../governance/audit"
import { recordReviewSummary } from "../records/adapter"
import { managementAttendanceStatus } from "../workforce/adapter"
import Drawer from "../workforce/Drawer"
import { formatDateTime } from "@/lib/time"
export default function ReportsPage({ tab = "reports" }: { tab?: string }) {
  const router = useRouter()
  return (
    <div className="ad-governance">
      <PageHead
        title="Reports & Audit"
        sub="Read-only fictional operational summaries and a bounded development metadata preview."
      />
      <SubTabs
        value={tab}
        onChange={(tab) => router.push(`/admin/reports?tab=${tab}`)}
        tabs={[
          { id: "reports", label: "Reports" },
          { id: "audit", label: "Audit log" },
        ]}
      />
      {tab === "reports" ? <Reports /> : <AuditPreview />}
    </div>
  )
}
function Reports() {
  const { data: s, role } = useAdmin(),
    [range, setRange] = useState("7"),
    docs = recordReviewSummary(s, role)
  const inRange = (at?: string) =>
    !!at &&
    Date.parse(at) >= Date.parse(s.now) - Number(range) * 86400000 &&
    Date.parse(at) <= Date.parse(s.now)
  const shifts = s.shifts.filter(
      (sh) => sh.status !== "cancelled" && inRange(sh.start),
    ),
    statuses = shifts.map((sh) => managementAttendanceStatus(s, sh))
  const rows = s.clients.map((c) => ({
    id: c.id,
    name: c.name,
    house: s.houses.find((h) => h.id === c.houseId)?.name,
    diary: s.diary.filter(
      (d) =>
        d.scope === "client" &&
        d.targetId === c.id &&
        d.status !== "draft" &&
        inRange(d.submittedAt),
    ).length,
    care: s.careRecords.filter(
      (r) =>
        r.clientId === c.id && r.status !== "draft" && inRange(r.submittedAt),
    ).length,
  }))
  const cards: Array<{
    title: string
    text: string
    stats: Array<[string, number]>
  }> = [
    {
      title: "Directory overview",
      text: "Current shared fictional records; independent of the period filter.",
      stats: [
        ["Employees", s.staff.length],
        ["Houses", s.houses.length],
        ["Clients", s.clients.length],
      ],
    },
    {
      title: "Attendance summary",
      text: "Scheduled shifts in the selected past period. Recorded events remain fictional and are not verified GPS or payroll.",
      stats: [
        ["Scheduled shifts", shifts.length],
        ["Completed", statuses.filter((x) => x === "Completed").length],
        [
          "Attendance exceptions",
          statuses.filter((x) =>
            [
              "Missing Clock-in",
              "Missing Clock-out",
              "Correction Pending",
            ].includes(x),
          ).length,
        ],
      ],
    },
    {
      title: "Documentation activity",
      text: "Submitted Client/House Diary and Care Plan/Charting in the selected period.",
      stats: [
        [
          "Diary entries",
          s.diary.filter((d) => d.status !== "draft" && inRange(d.submittedAt))
            .length,
        ],
        [
          "Care records",
          s.careRecords.filter(
            (r) => r.status !== "draft" && inRange(r.submittedAt),
          ).length,
        ],
      ],
    },
    {
      title: "Pending management reviews",
      text: "Current pending queues; independent of the period filter.",
      stats: [
        ["Care corrections", docs.pending],
        [
          "Attendance corrections",
          s.attendanceCorrections.filter((c) => c.status === "pending").length,
        ],
        [
          "Leave requests",
          s.leaveRequests.filter((l) => l.status === "pending").length,
        ],
        [
          "Open concerns",
          s.concerns.filter((c) =>
            ["Submitted", "Under Review"].includes(c.status),
          ).length,
        ],
      ],
    },
  ]
  return (
    <>
      <Filters>
        <Select
          label="Period"
          value={range}
          onChange={setRange}
          options={["7", "30", "90"].map((value) => ({
            value,
            label: `Last ${value} days`,
          }))}
        />
      </Filters>
      <div className="ad-grid-2">
        {cards.map((c) => (
          <Panel
            key={c.title}
            title={c.title}
            actions={
              <Btn variant="ghost" size="sm" disabled>
                Export CSV · Future Development
              </Btn>
            }
          >
            <p className="ad-faint">{c.text}</p>
            <div className="ad-mini-stats">
              {c.stats.map(([label, value]) => (
                <div key={label}>
                  <b>{value}</b>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </Panel>
        ))}
      </div>
      <Panel title="Documentation by client" pad={false}>
        <DataTable
          rows={rows}
          cols={[
            {
              key: "client",
              label: "Client",
              render: (c) => (
                <Link className="ad-link" href={`/admin/clients/${c.id}`}>
                  {c.name}
                </Link>
              ),
            },
            { key: "house", label: "House", render: (c) => c.house },
            {
              key: "diary",
              label: "Diary entries",
              sort: (c) => c.diary,
              render: (c) => c.diary,
            },
            {
              key: "care",
              label: "Care records",
              sort: (c) => c.care,
              render: (c) => c.care,
            },
          ]}
        />
      </Panel>
      <Banner tone="info" title="Future Development">
        Compliance exports, formal certification, production retention,
        historical restoration, payroll/financial reporting and comprehensive
        health analytics are unavailable.
      </Banner>
    </>
  )
}
function AuditPreview() {
  const { data: s, role } = useAdmin(),
    events = developmentEvents(s, role),
    [query, setQuery] = useState(""),
    [actor, setActor] = useState(""),
    [entity, setEntity] = useState(""),
    [range, setRange] = useState(""),
    [open, setOpen] = useState<DevelopmentEvent | null>(null)
  const rows = events.filter(
    (e) =>
      (!query ||
        `${e.action} ${e.targetId}`
          .toLowerCase()
          .includes(query.toLowerCase())) &&
      (!actor || e.actor === actor) &&
      (!entity || e.entity === entity) &&
      (!range ||
        Date.parse(e.at) >= Date.parse(s.now) - Number(range) * 86400000),
  )
  return (
    <>
      <Banner tone="info" title="Development Audit Preview">
        Derived only from supplied configuration/review metadata and this
        session’s actions. This is incomplete, editable browser state that
        resets on reload; it is not immutable, tamper-proof, legally sufficient
        or a durable production audit log. Modules without event metadata do not
        invent history.
      </Banner>
      <Filters>
        <SearchInput
          label="Search actions"
          placeholder="Search actions"
          value={query}
          onChange={setQuery}
        />
        <Select
          label="User"
          value={actor}
          onChange={setActor}
          options={[
            { value: "", label: "All users" },
            ...Array.from(new Set(events.map((e) => e.actor))).map((value) => ({
              value,
              label: value,
            })),
          ]}
        />
        <Select
          label="Entity"
          value={entity}
          onChange={setEntity}
          options={[
            { value: "", label: "All entities" },
            ...Array.from(new Set(events.map((e) => e.entity))).map(
              (value) => ({ value, label: value }),
            ),
          ]}
        />
        <Select
          label="Date"
          value={range}
          onChange={setRange}
          options={[
            { value: "", label: "Any date" },
            { value: "1", label: "Last 24 h" },
            { value: "7", label: "Last 7 days" },
            { value: "30", label: "Last 30 days" },
          ]}
        />
        <Btn variant="secondary" disabled>
          Export · Future Development
        </Btn>
      </Filters>
      <DataTable
        rows={rows}
        per={15}
        onRow={setOpen}
        empty={<Empty icon="shield" title="No available development events" />}
        cols={[
          {
            key: "at",
            label: "Date",
            sort: (e) => e.at,
            render: (e) => formatDateTime(e.at),
          },
          { key: "actor", label: "User", render: (e) => e.actor },
          { key: "action", label: "Action", render: (e) => <b>{e.action}</b> },
          { key: "entity", label: "Entity", render: (e) => e.entity },
          { key: "target", label: "Record", render: (e) => e.targetId },
          {
            key: "change",
            label: "Change",
            render: (e) =>
              e.before || e.after
                ? `${e.before ?? "Not supplied"} → ${e.after ?? "Not supplied"}`
                : "Not supplied",
          },
        ]}
      />
      {open && (
        <Drawer
          title={open.action}
          sub="Development metadata only"
          onClose={() => setOpen(null)}
        >
          <KV
            cols={1}
            items={[
              ["Actor", open.actor],
              ["Record", open.targetId],
              ["Entity", open.entity],
              ["Time", formatDateTime(open.at)],
              ["Before", open.before ?? "Not supplied"],
              ["After", open.after ?? "Not supplied"],
            ]}
          />
        </Drawer>
      )}
    </>
  )
}
