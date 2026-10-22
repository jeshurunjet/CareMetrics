import type {
  StaffSnapshot,
  CorrectionRequest,
  CorrectionTarget,
} from "./types"
export type CorrectionRecordType = "diary" | "care"
export const recordCorrections = (
  s: StaffSnapshot,
  type: CorrectionRecordType,
  id: string,
) =>
  s.corrections.filter(
    (c) => (c.recordType ?? "diary") === type && c.recordId === id,
  )
export function canRequestRecordCorrection(
  s: StaffSnapshot,
  type: CorrectionRecordType,
  id: string,
  authorId: string,
  status: string,
) {
  return (
    authorId === s.meId &&
    status !== "draft" &&
    !recordCorrections(s, type, id).some((c) => c.status === "pending")
  )
}
/** Callers must first resolve the scoped record and check its author/status. No review operation. */
export function appendCorrectionRequest(
  s: StaffSnapshot,
  recordType: CorrectionRecordType,
  recordId: string,
  reason: string,
  proposed: string,
  id: string,
  now: string,
  targets?: readonly CorrectionTarget[],
): StaffSnapshot {
  if (!reason.trim() || !proposed.trim())
    throw new Error("Reason and proposed correction are required.")
  if (s.corrections.some((c) => c.id === id))
    throw new Error("Duplicate correction ID")
  if (
    recordCorrections(s, recordType, recordId).some(
      (c) => c.status === "pending",
    )
  )
    throw new Error("Correction already pending")
  const request: CorrectionRequest = {
    id,
    targets,
    recordType,
    recordId,
    requestingEmployeeId: s.meId,
    reason: reason.trim(),
    proposed: proposed.trim(),
    requestedAt: now,
    status: "pending",
  }
  return { ...s, corrections: [request, ...s.corrections] }
}
