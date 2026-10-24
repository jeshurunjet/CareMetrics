"use client"
import Link from "next/link"
import { useState } from "react"
import { useAdmin, DataTable, Pill } from "../ui/core"
import { managedRequests } from "./adapter"
import RecordFilterBar, {
  useRecordFilters,
  matchesRecord,
} from "./RecordFilters"
import { correctionHref } from "./SubmittedRecords"
import { correctionStatus } from "../../staff/documentation/revisions"
import { formatDateTime } from "@/lib/time"
export default function CorrectionQueue() {
  const nav = useAdmin(),
    s = nav.data,
    f = useRecordFilters(),
    [status, setStatus] = useState("pending"),
    all = managedRequests(s, nav.role)
  const rows = all
    .filter(
      ({ record: r, request: c }) =>
        (status === "all" || c.status === status) &&
        matchesRecord(
          r,
          f,
          `${c.id} ${c.reason} ${c.proposed} ${r.title} ${r.context} ${s.staff.find((e) => e.id === c.requestingEmployeeId)?.name}`,
          c.requestedAt,
        ),
    )
    .map((x) => ({ ...x, id: x.request.id }))
  return (
    <>
      <div
        className="ad-seg ad-mb"
        role="group"
        aria-label="Correction outcomes"
      >
        {["pending", "approved", "rejected", "all"].map((v) => (
          <button
            key={v}
            aria-pressed={status === v}
            className={status === v ? "active" : ""}
            onClick={() => setStatus(v)}
          >
            {v === "pending"
              ? "Pending Review"
              : v === "all"
                ? "All"
                : v[0].toUpperCase() + v.slice(1)}{" "}
            ({all.filter((x) => v === "all" || x.request.status === v).length})
          </button>
        ))}
      </div>
      <RecordFilterBar f={f} records={all.map((x) => x.record)} requests />
      <div className="ad-records-table">
        <DataTable
          rows={rows}
          per={12}
          cols={[
            {
              key: "id",
              label: "Request",
              sort: (r) => r.id,
              render: (r) => <code className="ad-code">{r.id}</code>,
            },
            {
              key: "record",
              label: "Related record",
              render: (r) => (
                <>
                  <b>{r.record.title}</b>
                  <small className="ad-block ad-faint">{r.record.type}</small>
                </>
              ),
            },
            {
              key: "context",
              label: "Client / house",
              render: (r) => r.record.context,
            },
            {
              key: "by",
              label: "Requested by",
              render: (r) =>
                s.staff.find((e) => e.id === r.request.requestingEmployeeId)
                  ?.name,
            },
            {
              key: "at",
              label: "Requested",
              sort: (r) => r.request.requestedAt,
              render: (r) => formatDateTime(r.request.requestedAt),
            },
            { key: "reason", label: "Reason", render: (r) => r.request.reason },
            {
              key: "status",
              label: "Status",
              render: (r) => <Pill s={correctionStatus(r.request)} />,
            },
            {
              key: "reviewer",
              label: "Reviewer",
              render: (r) =>
                s.staff.find((e) => e.id === r.request.decision?.reviewerId)
                  ?.name ?? "Not assigned",
            },
            {
              key: "view",
              label: "Review",
              render: (r) => (
                <Link className="ad-link" href={correctionHref(r.id)}>
                  View request<span className="sr-only"> {r.id}</span>
                </Link>
              ),
            },
          ]}
        />
      </div>
    </>
  )
}
