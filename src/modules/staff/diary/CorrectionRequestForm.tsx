"use client"
import { useStaffData } from "../data/context"
import { canRequestCorrection, requestCorrection } from "../data/diary-adapter"
import type { DiaryEntry, DiarySubject } from "../data/types"
import { diaryEntryHref } from "./navigation"
import { UnavailableDiary } from "./shared"
import RecordCorrectionForm from "../documentation/RecordCorrectionForm"
export default function CorrectionRequestForm({
  subject,
  entry,
}: {
  subject: DiarySubject
  entry: DiaryEntry
}) {
  const s = useStaffData()
  return (
    <RecordCorrectionForm
      title={entry.title}
      original={<p className="cm-body cm-diary-text">{entry.body}</p>}
      allowed={canRequestCorrection(s, entry)}
      unavailable={<UnavailableDiary subject={subject} />}
      returnHref={diaryEntryHref(subject, entry.id)}
      onRequest={(snapshot, reason, proposed, id, now) =>
        requestCorrection(
          snapshot,
          subject,
          entry.id,
          reason,
          proposed,
          id,
          now,
        )
      }
    />
  )
}
