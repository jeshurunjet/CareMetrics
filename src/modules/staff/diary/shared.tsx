"use client"
import { useStaffData } from "../data/context"
import type { DiaryEntry, DiarySubject } from "../data/types"
import { getClient, getHouse } from "../data/queries"
import { formatDateTime } from "@/lib/time"
import { Banner, Status, Empty } from "../ui"
import Link from "next/link"
import { diaryHistoryHref } from "./navigation"
export function subjectName(
  s: ReturnType<typeof useStaffData>,
  subject: DiarySubject,
) {
  return (
    subject.scope === "client"
      ? getClient(s, subject.targetId)
      : getHouse(s, subject.targetId)
  )?.name
}
export function DiaryPreviewNotice() {
  return (
    <Banner tone="info">
      Development diary · fictional records. Drafts, submissions and correction
      requests are kept only while navigating this preview; reloading resets
      them. Nothing is saved to a server.
    </Banner>
  )
}
export function RecordStatus({ entry }: { entry: DiaryEntry }) {
  const s = useStaffData()
  const pending = s.corrections.some(
    (c) => c.recordId === entry.id && c.status === "pending",
  )
  return (
    <>
      <Status tone={entry.status === "draft" ? "warning" : "success"}>
        {entry.status === "draft"
          ? "Draft"
          : entry.status === "corrected"
            ? "Corrected"
            : "Submitted"}
      </Status>
      {entry.offShiftReason && (
        <Status tone="info" dot={false}>
          Off-shift
        </Status>
      )}
      {pending && (
        <Status tone="warning">Correction requested · Pending review</Status>
      )}
    </>
  )
}
export function RecordMetadata({ entry }: { entry: DiaryEntry }) {
  const s = useStaffData()
  return (
    <dl className="cm-dl cm-dl--inline">
      <div>
        <dt>Covers</dt>
        <dd>{formatDateTime(entry.coveredAt)}</dd>
      </div>
      <div>
        <dt>Created</dt>
        <dd>{formatDateTime(entry.createdAt)}</dd>
      </div>
      <div>
        <dt>Submitted</dt>
        <dd>
          {entry.submittedAt
            ? formatDateTime(entry.submittedAt)
            : "Not yet submitted"}
        </dd>
      </div>
      <div>
        <dt>Author</dt>
        <dd>
          {s.staff.find((e) => e.id === entry.authorId)?.name ?? "Staff member"}
        </dd>
      </div>
      {entry.offShiftReason && (
        <div>
          <dt>Off-shift reason</dt>
          <dd>{entry.offShiftReason}</dd>
        </div>
      )}
    </dl>
  )
}
export function UnavailableDiary({ subject }: { subject: DiarySubject }) {
  return (
    <Empty
      icon="shield"
      title="Diary entry unavailable"
      text="The entry could not be found in this diary or is not available to you. Reloading removes session-only demonstration entries."
      action={
        <Link href={diaryHistoryHref(subject)}>Back to diary history</Link>
      }
    />
  )
}
