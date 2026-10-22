"use client"
import { useState } from "react"
import Link from "next/link"
import { useStaffData } from "../data/context"
import type { CareRecord, CareTemplate } from "./types"
import { Icon } from "../ui"
import { RecordStatus, RecordMetadata } from "../diary/shared"
import ReadOnlyFormValues from "../../forms/ReadOnlyFormValues"
import { formatDate, formatDateTime } from "@/lib/time"
import { careDetailHref, careFormHref } from "./navigation"
export default function AssessmentRecordCard({
  record,
  template,
  defaultOpen,
}: {
  record: CareRecord
  template: CareTemplate
  defaultOpen: boolean
}) {
  const s = useStaffData(),
    [open, setOpen] = useState(defaultOpen)
  const version = template.versions.find(
    (v) => v.version === record.templateVersion,
  )!
  return (
    <article className={`cm-history ${open ? "open" : ""}`}>
      <button
        className="cm-history-head"
        aria-expanded={open}
        aria-label={`${
          open ? "Collapse" : "Expand"
        } ${template.name} ${formatDate(record.coveredAt)}`}
        onClick={() => setOpen((v) => !v)}
      >
        <div>
          <div className="cm-history-title">
            {template.name} — {formatDate(record.coveredAt)}
            <RecordStatus entry={record} recordType="care" />
          </div>
          <div className="cm-history-meta">
            {formatDateTime(record.coveredAt)} ·{" "}
            {s.staff.find((e) => e.id === record.authorId)?.name ??
              "Staff member"}{" "}
            · v{record.templateVersion} ·{" "}
            {record.submittedAt
              ? `Submitted ${formatDateTime(record.submittedAt)}`
              : "Not yet submitted"}
          </div>
          {!open && (
            <p className="cm-history-preview">
              {Object.values(record.values)
                .map((v) => (Array.isArray(v) ? v.join(", ") : String(v)))
                .join(" · ")
                .slice(0, 110)}
            </p>
          )}
        </div>
        <Icon name="down" size={18} />
      </button>
      {open && (
        <div className="cm-history-body">
          <ReadOnlyFormValues version={version} values={record.values} />
          <RecordMetadata entry={record} />
          <div className="cm-row-actions">
            <Link
              className="cm-btn cm-btn--secondary cm-btn--sm"
              href={careDetailHref(
                record.clientId,
                record.templateId,
                record.id,
              )}
            >
              View assessment
            </Link>
            {record.status === "draft" && (
              <Link
                className="cm-btn cm-btn--primary cm-btn--sm"
                href={careFormHref(
                  record.clientId,
                  record.templateId,
                  record.id,
                )}
              >
                Continue draft
              </Link>
            )}
          </div>
        </div>
      )}
    </article>
  )
}
