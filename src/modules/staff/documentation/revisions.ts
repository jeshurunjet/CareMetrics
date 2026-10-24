import type {
  StaffSnapshot,
  DiaryEntry,
  CorrectionRequest,
  CorrectionTarget,
} from "../data/types"
import type { CareRecord } from "../care/types"
import type { FormValue, FormValues } from "../../forms/types"
interface DiaryProposal {
  kind: "diary"
  body: string
}
interface CareChange {
  target: CorrectionTarget
  value: FormValue
}
interface CareProposal {
  kind: "care"
  changes: readonly CareChange[]
}
export type CorrectionProposal = DiaryProposal | CareProposal
interface RevisionBase {
  id: string
  baseRevisionId?: string
  requestId: string
}
interface DiaryRevision extends RevisionBase {
  kind: "diary"
  body: string
}
interface CareRevision extends RevisionBase {
  kind: "care"
  values: FormValues
}
export type RecordRevision = DiaryRevision | CareRevision
/** Revisions are embedded in the existing shared requests, never written over original records. */
export function latestRevision(
  s: StaffSnapshot,
  kind: "diary" | "care",
  id: string,
) {
  let current: RecordRevision | undefined
  const remaining = s.corrections.filter(
    (c) =>
      (c.recordType ?? "diary") === kind &&
      c.recordId === id &&
      c.status === "approved" &&
      c.decision?.revision,
  )
  // Follow the explicit chain; equal timestamps do not determine order.
  for (let n = 0; n < remaining.length; n++) {
    const next = remaining.find(
      (c) =>
        c.decision!.revision!.baseRevisionId === current?.id &&
        c.decision!.revision!.id !== current?.id,
    )
    if (!next) break
    current = next.decision!.revision
  }
  return current
}
export function effectiveDiary(s: StaffSnapshot, r: DiaryEntry): DiaryEntry {
  const revision = latestRevision(s, "diary", r.id)
  return revision?.kind === "diary"
    ? { ...r, body: revision.body, status: "corrected" }
    : r
}
export function effectiveCare(s: StaffSnapshot, r: CareRecord): CareRecord {
  const revision = latestRevision(s, "care", r.id)
  return revision?.kind === "care"
    ? { ...r, values: revision.values, status: "corrected" }
    : r
}
export function correctionStatus(c?: CorrectionRequest) {
  return !c
    ? "None"
    : c.status === "pending"
      ? "Pending Review"
      : c.status === "approved"
        ? "Approved"
        : "Rejected"
}
