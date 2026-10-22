"use client"
import Link from "next/link"
import { formatDateTime } from "@/lib/time"
import { useStaffData } from "../data/context"
import type { DiarySubject } from "../data/types"
import { getDiaryEntry, canRequestCorrection } from "../data/diary-adapter"
import { Card } from "../ui"
import CorrectionRequestForm from "./CorrectionRequestForm"
import {
  RecordStatus,
  RecordMetadata,
  UnavailableDiary,
  DiaryPreviewNotice,
} from "./shared"
import { diaryEntryHref, diaryHistoryHref, diaryFormHref } from "./navigation"
export default function DiaryEntryDetails({
  subject,
  id,
  correction,
}: {
  subject: DiarySubject
  id: string
  correction: boolean
}) {
  const s = useStaffData(),
    entry = getDiaryEntry(s, subject, id)
  if (!entry) return <UnavailableDiary subject={subject} />
  if (correction)
    return (
      <CorrectionRequestForm subject={subject} entry={entry} key={entry.id} />
    )
  const requests = s.corrections.filter((c) => c.recordId === entry.id)
  return (
    <div className="cm-stack">
      <Link href={diaryHistoryHref(subject)}>Back to diary history</Link>
      <DiaryPreviewNotice />
      <Card className="cm-panel">
        <h2 className="cm-h3">{entry.title}</h2>
        <div className="cm-chip-row">
          <RecordStatus entry={entry} />
        </div>
        <p className="cm-muted">
          {s.diaryCategories.find((c) => c.id === entry.categoryId)?.name ??
            "Uncategorised"}
        </p>
        <p className="cm-body cm-diary-text">
          {entry.body || "Draft content not yet entered."}
        </p>
        <RecordMetadata entry={entry} />
        <div className="cm-row-actions">
          {entry.status === "draft" ? (
            <Link
              className="cm-btn cm-btn--primary cm-btn--md"
              href={diaryFormHref(subject, entry.id)}
            >
              Continue draft
            </Link>
          ) : canRequestCorrection(s, entry) ? (
            <Link
              className="cm-btn cm-btn--secondary cm-btn--md"
              href={diaryEntryHref(subject, id, true)}
            >
              Request correction
            </Link>
          ) : (
            <p className="cm-hint">
              Submitted content is read-only. Corrections require management
              review.
            </p>
          )}
        </div>
      </Card>
      {requests.map((c) => (
        <Card className="cm-panel" key={c.id}>
          <h3 className="cm-h3">
            Correction {c.status === "pending" ? "pending review" : c.status}
          </h3>
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
          </dl>
          <p className="cm-hint">
            Management review is not implemented. The original entry is
            unchanged.
          </p>
        </Card>
      ))}
    </div>
  )
}
