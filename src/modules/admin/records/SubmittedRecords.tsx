"use client"
import Link from "next/link"
import { useAdmin, Stat, DataTable, Pill } from "../ui/core"
import { recordReviewSummary, type SubmittedRecord } from "./adapter"
import RecordFilterBar, {
  useRecordFilters,
  matchesRecord,
} from "./RecordFilters"
import { recordCorrections } from "../../staff/data/correction-service"
import {
  correctionStatus,
  latestRevision,
} from "../../staff/documentation/revisions"
import { formatDateTime } from "@/lib/time"
export const recordHref = (r: Pick<SubmittedRecord, "id" | "kind">) =>
  `/admin/documentation/records/${encodeURIComponent(r.id)}?kind=${r.kind}`
export const correctionHref = (id: string) =>
  `/admin/documentation/corrections/${encodeURIComponent(id)}`
export default function SubmittedRecords() {
  const nav = useAdmin(),
    s = nav.data,
    f = useRecordFilters(),
    summary = recordReviewSummary(s, nav.role)
  const latest = (r: SubmittedRecord) =>
    recordCorrections(s, r.kind, r.id)
      .slice()
      .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))[0]
  const rows = summary.records.filter(
    (r) =>
      matchesRecord(
        r,
        f,
        `${r.id} ${r.title} ${r.category} ${r.context} ${s.staff.find((e) => e.id === r.authorId)?.name} ${r.diary?.body ?? JSON.stringify(r.care?.values)}`,
      ) &&
      (!f.status || correctionStatus(latest(r)) === f.status),
  )
  return (
    <>
      <div className="ad-stats ad-stats--4">
        <Stat
          icon="clipboard"
          label="Total submitted records"
          value={summary.total}
        />
        {([
          "Client Diary",
          "House Diary",
          "Care Plan",
          "Charting",
        ] as const).map((type) => (
          <Stat
            key={type}
            icon="book"
            label={type}
            value={summary.records.filter((r) => r.type === type).length}
            onClick={() => f.setType(type)}
          />
        ))}
        <Stat
          icon="flag"
          label="Pending care-record corrections"
          value={summary.pending}
        />
        <Stat
          icon="check"
          label="Recently corrected (7 days)"
          value={summary.recent}
        />
      </div>
      <RecordFilterBar f={f} records={summary.records} />
      {f.type === "House Diary" && (
        <p className="ad-faint">
          Operational House Diary records remain separate from client care
          documentation.
        </p>
      )}
      <div className="ad-records-table">
        <DataTable
          rows={rows}
          per={12}
          cols={[
            {
              key: "id",
              label: "Record",
              sort: (r) => r.id,
              render: (r) => <code className="ad-code">{r.id}</code>,
            },
            {
              key: "context",
              label: "Client / house",
              sort: (r) => r.context,
              render: (r) => r.context,
            },
            {
              key: "type",
              label: "Type",
              sort: (r) => r.type,
              render: (r) => r.type,
            },
            {
              key: "category",
              label: "Category / template",
              sort: (r) => r.category,
              render: (r) => (
                <>
                  <b>{r.title}</b>
                  <small className="ad-block ad-faint">{r.category}</small>
                </>
              ),
            },
            {
              key: "author",
              label: "Author",
              render: (r) => s.staff.find((e) => e.id === r.authorId)?.name,
            },
            {
              key: "covered",
              label: "Covered",
              sort: (r) => r.coveredAt,
              render: (r) => formatDateTime(r.coveredAt),
            },
            {
              key: "submitted",
              label: "Submitted",
              sort: (r) => r.submittedAt,
              render: (r) => formatDateTime(r.submittedAt),
            },
            {
              key: "status",
              label: "Status",
              render: (r) => (
                <span className="ad-chips">
                  <Pill
                    s={
                      latestRevision(s, r.kind, r.id)
                        ? "Corrected"
                        : "Submitted"
                    }
                  />
                  {r.offShiftReason && (
                    <Pill s="Off-shift" label="Off-Shift Entry" />
                  )}
                  <Pill
                    s={correctionStatus(latest(r))}
                    label={`Correction: ${correctionStatus(latest(r))}`}
                  />
                </span>
              ),
            },
            {
              key: "view",
              label: "Details",
              render: (r) => (
                <Link className="ad-link" href={recordHref(r)}>
                  View details<span className="sr-only"> {r.id}</span>
                </Link>
              ),
            },
          ]}
        />
      </div>
    </>
  )
}
