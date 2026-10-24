"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  useAdmin,
  PageHead,
  SubTabs,
  DataTable,
  Pill,
  Select,
} from "../ui/core"
import { Empty } from "../../staff/ui"
import { audienceLabel } from "../governance/adapter"
import { formatDateTime } from "@/lib/time"
import ContextFilters, { useFilters, matches } from "../governance/Filters"
import ConcernQueue from "./ConcernQueue"
export const noticeHref = (id: string) =>
  `/admin/notifications/${encodeURIComponent(id)}/edit`
export const concernHref = (id: string) =>
  `/admin/concerns/${encodeURIComponent(id)}`
export default function NoticesPage({ tab = "notices" }: { tab?: string }) {
  const { data: s } = useAdmin(),
    router = useRouter()
  return (
    <div className="ad-governance">
      <PageHead
        title="Notifications & Concerns"
        sub="Publish official notices and separately review staff concerns in fictional development state."
        actions={
          tab === "notices" && (
            <Link
              className="cm-btn cm-btn--primary cm-btn--md"
              href="/admin/notifications/new"
            >
              New notification
            </Link>
          )
        }
      />
      <SubTabs
        value={tab}
        onChange={(tab) => router.push(`/admin/notifications?tab=${tab}`)}
        tabs={[
          { id: "notices", label: "Notifications" },
          {
            id: "concerns",
            label: "Concerns",
            count: s.concerns.filter((c) =>
              ["Submitted", "Under Review"].includes(c.status),
            ).length,
          },
        ]}
      />
      {tab === "notices" ? <NoticeList /> : <ConcernQueue />}
    </div>
  )
}
function NoticeList() {
  const { data: s } = useAdmin(),
    router = useRouter(),
    f = useFilters(),
    [status, setStatus] = useState(""),
    [category, setCategory] = useState(""),
    [priority, setPriority] = useState("")
  const rows = s.notices
    .filter((n) => {
      const client = n.category === "client" ? n.relatedId : undefined,
        house =
          n.category === "house"
            ? n.relatedId
            : s.clients.find((c) => c.id === client)?.houseId
      return (
        matches(
          f,
          `${n.id} ${n.title} ${n.body ?? ""} ${n.publisher} ${audienceLabel(s, n)}`,
          n.date,
          client,
          house,
        ) &&
        (!status || n.status === status) &&
        (!category || n.category === category) &&
        (!priority || n.priority === priority)
      )
    })
    .sort((a, b) => b.date.localeCompare(a.date))
  return (
    <>
      <ContextFilters f={f} label="Search notifications">
        <Select
          label="Status"
          value={status}
          onChange={setStatus}
          options={["", "Draft", "Published", "Withdrawn"].map((value) => ({
            value,
            label: value || "Any status",
          }))}
        />
        <Select
          label="Type"
          value={category}
          onChange={setCategory}
          options={["", "staff", "house", "client"].map((value) => ({
            value,
            label: value || "All types",
          }))}
        />
        <Select
          label="Priority"
          value={priority}
          onChange={setPriority}
          options={["", "Normal", "Important", "Urgent"].map((value) => ({
            value,
            label: value || "Any priority",
          }))}
        />
      </ContextFilters>
      <DataTable
        rows={rows}
        onRow={(n) => router.push(noticeHref(n.id))}
        empty={<Empty icon="bell" title="No notifications" />}
        cols={[
          {
            key: "title",
            label: "Title",
            sort: (n) => n.title,
            render: (n) => (
              <>
                <b>{n.title}</b>
                <small className="ad-block ad-faint ad-clamp">{n.body}</small>
              </>
            ),
          },
          {
            key: "type",
            label: "Type / context",
            render: (n) => (
              <>
                {n.category}
                <small className="ad-block ad-faint">
                  {n.category === "staff"
                    ? "Staff"
                    : (n.category === "client" ? s.clients : s.houses).find(
                        (x) => x.id === n.relatedId,
                      )?.name}
                </small>
              </>
            ),
          },
          {
            key: "audience",
            label: "Audience",
            render: (n) => audienceLabel(s, n),
          },
          {
            key: "priority",
            label: "Priority",
            sort: (n) => n.priority,
            render: (n) => <Pill s={n.priority} />,
          },
          {
            key: "status",
            label: "Status",
            render: (n) => <Pill s={n.status} />,
          },
          {
            key: "at",
            label: "Publication / update",
            sort: (n) => n.date,
            render: (n) => (
              <>
                {formatDateTime(n.date)}
                <small className="ad-block ad-faint">
                  {n.publisher}
                  {n.status === "Draft" && " · draft author"}
                </small>
              </>
            ),
          },
          {
            key: "actions",
            label: "Actions",
            render: (n) => (
              <Link className="ad-link" href={noticeHref(n.id)}>
                {n.status === "Draft" ? "Edit draft" : "View notice"}
              </Link>
            ),
          },
        ]}
      />
      <p className="ad-faint">
        Publication changes this session’s authorised feed only. No push, email,
        SMS or real employee delivery occurs.
      </p>
    </>
  )
}
