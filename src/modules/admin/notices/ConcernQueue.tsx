"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAdmin, DataTable, Pill, Select } from "../ui/core"
import { managedConcerns, subjectName } from "../governance/adapter"
import { concernHref } from "./NoticesPage"
import ContextFilters, { useFilters, matches } from "../governance/Filters"
import { Empty } from "../../staff/ui"
import { formatDateTime } from "@/lib/time"
export default function ConcernQueue() {
  const { data: s, role } = useAdmin(),
    router = useRouter(),
    f = useFilters(),
    [status, setStatus] = useState("open"),
    [priority, setPriority] = useState("")
  const rows = managedConcerns(s, role)
    .filter((c) => {
      const client = c.context === "client" ? c.targetId : undefined,
        house =
          c.context === "house"
            ? c.targetId
            : s.clients.find((x) => x.id === client)?.houseId
      return (
        matches(
          f,
          `${c.id} ${c.title} ${c.description} ${s.staff.find((e) => e.id === c.submittedById)?.name}`,
          c.submittedAt,
          client,
          house,
        ) &&
        (!priority || c.priority === priority) &&
        (!status ||
          (status === "open"
            ? ["Submitted", "Under Review"].includes(c.status)
            : c.status === status))
      )
    })
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
  return (
    <>
      <ContextFilters f={f} label="Search concerns">
        <Select
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: "open", label: "Open" },
            ...["", "Submitted", "Under Review", "Resolved", "Closed"].map(
              (value) => ({ value, label: value || "All statuses" }),
            ),
          ]}
        />
        <Select
          label="Priority"
          value={priority}
          onChange={setPriority}
          options={["", "High", "Medium", "Low"].map((value) => ({
            value,
            label: value || "Any priority",
          }))}
        />
      </ContextFilters>
      <DataTable
        rows={rows}
        onRow={(c) => router.push(concernHref(c.id))}
        empty={
          <Empty
            title="No concerns"
            text="No shared concerns match these filters."
          />
        }
        cols={[
          {
            key: "title",
            label: "Concern",
            sort: (c) => c.title,
            render: (c) => (
              <>
                <b>{c.title}</b>
                <small className="ad-block ad-faint">{c.id}</small>
              </>
            ),
          },
          {
            key: "about",
            label: "About",
            render: (c) => (
              <>
                {subjectName(s, { scope: c.context, targetId: c.targetId })}
                <small className="ad-block ad-faint">{c.context}</small>
              </>
            ),
          },
          {
            key: "priority",
            label: "Priority",
            sort: (c) => ["High", "Medium", "Low"].indexOf(c.priority),
            render: (c) => <Pill s={c.priority} />,
          },
          {
            key: "author",
            label: "Raised by",
            render: (c) => s.staff.find((e) => e.id === c.submittedById)?.name,
          },
          {
            key: "at",
            label: "Raised",
            sort: (c) => c.submittedAt,
            render: (c) => formatDateTime(c.submittedAt),
          },
          {
            key: "status",
            label: "Status",
            render: (c) => <Pill s={c.status} />,
          },
          {
            key: "reviewer",
            label: "Reviewer",
            render: (c) =>
              s.staff.find((e) => e.id === c.reviewerId)?.name ?? "Unassigned",
          },
          {
            key: "actions",
            label: "Actions",
            render: (c) => (
              <Link className="ad-link" href={concernHref(c.id)}>
                Review
              </Link>
            ),
          },
        ]}
      />
      <p className="ad-faint">
        This feature does not replace urgent incident or emergency procedures.
        There is no real-time escalation.
      </p>
    </>
  )
}
