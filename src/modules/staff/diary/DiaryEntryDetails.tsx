"use client"
import Link from "next/link"
import { effectiveDiary, latestRevision } from "../documentation/revisions"
import RecordRevisionHistory from "../documentation/RecordRevisionHistory"
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
    original = getDiaryEntry(s, subject, id),
    entry = original && effectiveDiary(s, original)
  if (!entry) return <UnavailableDiary subject={subject} />
  if (correction)
    return (
      <CorrectionRequestForm subject={subject} entry={entry} key={entry.id} />
    )
  const revision = latestRevision(s, "diary", entry.id)
  return (
    <div className="cm-stack">
      <Link href={diaryHistoryHref(subject)}>Back to diary history</Link>
      <DiaryPreviewNotice />
      <Card className="cm-panel">
        <h2 className="cm-h3">{entry.title}</h2>
        {revision && (
          <p className="cm-hint">
            Corrected effective record · original submission retained below.
          </p>
        )}
        <div className="cm-chip-row">
          <RecordStatus entry={entry} />
        </div>
        <p className="cm-muted">
          {entry.categoryName ??
            s.diaryCategories.find((c) => c.id === entry.categoryId)?.name ??
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
      <RecordRevisionHistory s={s} kind="diary" record={original!} />
    </div>
  )
}
