"use client"
import { useState } from "react"
import type { DiaryEntry, StaffSnapshot } from "../data/types"
import type { CareRecord } from "../care/types"
import { recordCorrections } from "../data/correction-service"
import { latestRevision } from "./revisions"
import { formatDateTime } from "@/lib/time"
import ReadOnlyFormValues from "../../forms/ReadOnlyFormValues"
import Pagination from "../ui/Pagination"
function HistoryDisclosure({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <details open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>{label}</summary>
      {open && children}
    </details>
  )
}
export default function RecordRevisionHistory({
  s,
  kind,
  record,
}: {
  s: StaffSnapshot
  kind: "diary" | "care"
  record: DiaryEntry | CareRecord
}) {
  const [page, setPage] = useState(1)
  const requests = recordCorrections(s, kind, record.id),
    current = latestRevision(s, kind, record.id)
  const version =
    "templateId" in record
      ? s.careTemplates
          .find((t) => t.id === record.templateId)
          ?.versions.find((v) => v.version === record.templateVersion)
      : undefined
  const answers = (values: import("../../forms/types").FormValues) =>
    version ? (
      <ReadOnlyFormValues version={version} values={values} />
    ) : (
      <p>Original version unavailable.</p>
    )
  if (record.status === "draft") return null
  return (
    <section className="cm-stack" aria-label="Record revision history">
      <h3 className="cm-h3">Record revision history</h3>
      <p>
        Initial submission ·{" "}
        {formatDateTime(record.submittedAt ?? record.createdAt)} ·{" "}
        {s.staff.find((e) => e.id === record.authorId)?.name ??
          "Author unavailable"}
      </p>
      <HistoryDisclosure label="View original submission">
        {"body" in record ? (
          <p className="cm-diary-text">{record.body}</p>
        ) : (
          answers(record.values)
        )}
      </HistoryDisclosure>
      {requests.slice((page - 1) * 6, page * 6).map((c) => (
        <article className="cm-panel" key={c.id}>
          <h4>
            Correction {c.status === "pending" ? "pending review" : c.status}
          </h4>
          <dl className="cm-dl">
            <div>
              <dt>Reason</dt>
              <dd>{c.reason}</dd>
            </div>
            <div>
              <dt>Proposed correction</dt>
              <dd className="cm-diary-text">{c.proposed}</dd>
            </div>
            <div>
              <dt>Requested</dt>
              <dd>{formatDateTime(c.requestedAt)}</dd>
            </div>
            {c.decision && (
              <>
                <div>
                  <dt>Reviewer</dt>
                  <dd>
                    {s.staff.find((e) => e.id === c.decision!.reviewerId)
                      ?.name ??
                      c.decision.reviewerName ??
                      c.decision.reviewerId}
                  </dd>
                </div>
                <div>
                  <dt>Decision time</dt>
                  <dd>{formatDateTime(c.decision.at)}</dd>
                </div>
                <div>
                  <dt>Review notes</dt>
                  <dd>{c.decision.notes || "No notes supplied"}</dd>
                </div>
              </>
            )}
          </dl>
          {c.targets?.map((t) => (
            <p className="cm-hint" key={JSON.stringify(t)}>
              Reference: field {t.fieldId}
              {t.rowId ? ` · row ${t.rowId} · column ${t.columnId}` : ""}
            </p>
          ))}
          {c.decision?.revision ? (
            <details>
              <summary>
                View approved revision{" "}
                {c.decision.revision.id === current?.id
                  ? "· Effective revision"
                  : "· Superseded"}
              </summary>
              {c.decision.revision.kind === "diary" ? (
                <p className="cm-diary-text">{c.decision.revision.body}</p>
              ) : (
                answers(c.decision.revision.values)
              )}
              <p className="cm-hint">
                Revision {c.decision.revision.id} · base{" "}
                {c.baseRevisionId ?? "original submission"}
              </p>
            </details>
          ) : (
            <p className="cm-hint">
              {c.status === "pending"
                ? "Awaiting management review. Original submission retained."
                : c.status === "rejected"
                  ? "Rejected; effective content was not changed."
                  : "Legacy decision metadata unavailable; no effective revision applied."}
            </p>
          )}
        </article>
      ))}
      <Pagination
        page={page}
        total={requests.length}
        per={6}
        onChange={setPage}
      />
    </section>
  )
}
