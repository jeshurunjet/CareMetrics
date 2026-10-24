"use client"
import { useState } from "react"
import Link from "next/link"
import { useStaffData } from "../data/context"
import type { DiaryEntry } from "../data/types"
import { Icon, Status } from "../ui"
import { formatDateTime } from "@/lib/time"
import { RecordStatus, RecordMetadata } from "./shared"
import { diaryEntryHref, diaryFormHref } from "./navigation"
export default function DiaryEntryCard({
  entry,
  defaultOpen,
}: {
  entry: DiaryEntry
  defaultOpen: boolean
}) {
  const s = useStaffData()
  const [open, setOpen] = useState(defaultOpen)
  return (
    <article className={`cm-history ${open ? "open" : ""}`}>
      <button
        className="cm-history-head"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`${open ? "Collapse" : "Expand"} ${entry.title}`}
      >
        <div>
          <div className="cm-history-title">
            {entry.title}
            <Status tone="brand" dot={false}>
              {entry.categoryName ??
                s.diaryCategories.find((c) => c.id === entry.categoryId)
                  ?.name ??
                "Uncategorised"}
            </Status>
            <RecordStatus entry={entry} />
          </div>
          <div className="cm-history-meta">
            {formatDateTime(entry.coveredAt)} ·{" "}
            {s.staff.find((e) => e.id === entry.authorId)?.name ??
              "Staff member"}{" "}
            ·{" "}
            {entry.submittedAt
              ? `Submitted ${formatDateTime(entry.submittedAt)}`
              : "Not yet submitted"}
          </div>
          {!open && (
            <p className="cm-history-preview">
              {entry.body.slice(0, 110)}
              {entry.body.length > 110 ? "…" : ""}
            </p>
          )}
        </div>
        <Icon name="down" size={18} />
      </button>
      {open && (
        <div className="cm-history-body">
          <p className="cm-body cm-diary-text">
            {entry.body || "Draft content not yet entered."}
          </p>
          <RecordMetadata entry={entry} />
          <div className="cm-row-actions">
            <Link
              className="cm-btn cm-btn--secondary cm-btn--sm"
              href={diaryEntryHref(entry, entry.id)}
            >
              View details
            </Link>
            {entry.status === "draft" && (
              <Link
                className="cm-btn cm-btn--sm"
                href={diaryFormHref(entry, entry.id)}
              >
                <Icon name="edit" size={15} />
                Continue draft
              </Link>
            )}
          </div>
        </div>
      )}
    </article>
  )
}
