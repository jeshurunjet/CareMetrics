import type {
  StaffSnapshot,
  DiaryEntry,
  CorrectionRequest,
} from "../../staff/data/types"
import type { CareRecord } from "../../staff/care/types"
import type { ConfigurableFormVersion } from "../../forms/types"
import { requireManagement } from "../data/adapter"
import {
  latestRevision,
  effectiveDiary,
  effectiveCare,
  type CorrectionProposal,
  type RecordRevision,
} from "../../staff/documentation/revisions"
import { applyCareProposal } from "../../staff/documentation/proposals"
export type RecordKind = "diary" | "care"
export type RecordType = "Client Diary" | "House Diary" | "Care Plan" | "Charting"
export interface SubmittedRecord {
  id: string
  kind: RecordKind
  type: RecordType
  title: string
  category: string
  categoryKey: string
  authorId: string
  houseId: string
  clientId?: string
  context: string
  coveredAt: string
  createdAt: string
  submittedAt: string
  offShiftReason?: string
  diary?: DiaryEntry
  care?: CareRecord
  version?: ConfigurableFormVersion
}
export function reviewActor(s: StaffSnapshot, role: string) {
  requireManagement(role)
  const id = role === "Administrator" ? "a1" : "m1"
  if (
    !s.organisation?.id ||
    !s.staff.some(
      (e) => e.id === id && e.status === "Active" && e.role === role,
    )
  )
    throw new Error("Management organisation/actor unavailable.")
  return id
}
/** Management scope is the existing single-organisation operational scope. Invalid relationships are omitted. */
export function submittedRecords(
  s: StaffSnapshot,
  role: string,
): SubmittedRecord[] {
  reviewActor(s, role)
  const author = (id: string) => s.staff.some((e) => e.id === id)
  const valid = (r: DiaryEntry | CareRecord) =>
    r.status !== "draft" &&
    !!r.submittedAt &&
    Number.isFinite(Date.parse(r.submittedAt)) &&
    Number.isFinite(Date.parse(r.coveredAt)) &&
    author(r.authorId)
  const diary: SubmittedRecord[] = s.diary.filter(valid).flatMap((d) => {
    const client =
      d.scope === "client"
        ? s.clients.find((c) => c.id === d.targetId)
        : undefined
    const house = s.houses.find(
      (h) => h.id === (d.scope === "house" ? d.targetId : client?.houseId),
    )
    const cat = s.diaryCategories.find(
      (c) => c.id === d.categoryId && c.scope === d.scope,
    )
    if (!house || !cat || (d.scope !== "house" && !client)) return []
    return [
      {
        id: d.id,
        kind: "diary",
        type: d.scope === "client" ? "Client Diary" : "House Diary",
        title: d.title,
        category: d.categoryName ?? cat.name,
        categoryKey: `diary:${d.scope}:${cat.id}`,
        authorId: d.authorId,
        houseId: house.id,
        clientId: client?.id,
        context: client?.name ?? house.name,
        coveredAt: d.coveredAt,
        createdAt: d.createdAt,
        submittedAt: d.submittedAt!,
        offShiftReason: d.offShiftReason,
        diary: d,
      },
    ]
  })
  const care: SubmittedRecord[] = s.careRecords.filter(valid).flatMap((r) => {
    const client = s.clients.find((c) => c.id === r.clientId),
      house = s.houses.find((h) => h.id === client?.houseId),
      template = s.careTemplates.find((t) => t.id === r.templateId),
      version = template?.versions.find(
        (v) => v.version === r.templateVersion && v.published,
      )
    if (!client || !house || !template || !version) return []
    const title = version.name ?? template.legacyMetadata?.name ?? template.name
    return [
      {
        id: r.id,
        kind: "care",
        type: template.kind === "chart" ? "Charting" : "Care Plan",
        title,
        category: `${title} v${version.version}`,
        categoryKey: `template:${template.id}`,
        authorId: r.authorId,
        houseId: house.id,
        clientId: client.id,
        context: client.name,
        coveredAt: r.coveredAt,
        createdAt: r.createdAt,
        submittedAt: r.submittedAt!,
        offShiftReason: r.offShiftReason,
        care: r,
        version,
      },
    ]
  })
  return [...diary, ...care].sort((a, b) =>
    b.submittedAt.localeCompare(a.submittedAt),
  )
}
export function managedRecord(
  s: StaffSnapshot,
  role: string,
  kind: RecordKind,
  id: string,
) {
  return submittedRecords(s, role).find((r) => r.kind === kind && r.id === id)
}
export function managedRequests(s: StaffSnapshot, role: string) {
  const records = submittedRecords(s, role)
  return s.corrections
    .flatMap((request) => {
      const record = records.find(
        (r) =>
          r.id === request.recordId &&
          r.kind === (request.recordType ?? "diary"),
      )
      return record &&
        request.requestingEmployeeId === record.authorId &&
        Number.isFinite(Date.parse(request.requestedAt))
        ? [{ request, record }]
        : []
    })
    .sort((a, b) => b.request.requestedAt.localeCompare(a.request.requestedAt))
}
export function proposedRevision(
  s: StaffSnapshot,
  r: SubmittedRecord,
  c: CorrectionRequest,
): RecordRevision {
  const base = latestRevision(s, r.kind, r.id)
  if (c.baseRevisionId !== base?.id)
    throw new Error(
      "This request is stale: the effective revision changed. Reject with a reason and request a new review; automatic rebasing is unavailable.",
    )
  if (!c.reason.trim() || !c.proposed.trim())
    throw new Error("Correction reason and proposal are required.")
  const common = {
    id: `revision-${c.id}`,
    requestId: c.id,
    baseRevisionId: c.baseRevisionId,
  }
  if (r.diary) {
    const proposal: CorrectionProposal = c.proposal ?? {
      kind: "diary",
      body: c.proposed,
    }
    if (
      proposal.kind !== "diary" ||
      Object.keys(proposal).some((k) => !["kind", "body"].includes(k)) ||
      typeof proposal.body !== "string" ||
      proposal.body.trim().length < 10 ||
      proposal.body.length > 50000 ||
      proposal.body.trim() === effectiveDiary(s, r.diary).body
    )
      throw new Error("Enter a changed diary body of at least 10 characters.")
    return { ...common, kind: "diary", body: proposal.body.trim() }
  }
  if (!r.care || !c.proposal)
    throw new Error(
      "Text-only structured requests require a new typed proposal before approval. They can be rejected with review notes.",
    )
  return {
    ...common,
    kind: "care",
    values: applyCareProposal(s, r.care, c.proposal),
  }
}
export function reviewCorrection(
  s: StaffSnapshot,
  role: string,
  id: string,
  outcome: "approved" | "rejected",
  notes: string,
  at = s.now,
): StaffSnapshot {
  const reviewerId = reviewActor(s, role),
    found = managedRequests(s, role).find((x) => x.request.id === id)
  if (
    !found ||
    found.request.status !== "pending" ||
    !["approved", "rejected"].includes(outcome)
  )
    throw new Error("Only a pending, authorised request can be decided once.")
  if (
    typeof notes !== "string" ||
    notes.length > 5000 ||
    (outcome === "rejected" && !notes.trim())
  )
    throw new Error("A rejection reason is required (maximum 5000 characters).")
  if (
    !Number.isFinite(Date.parse(at)) ||
    Date.parse(at) < Date.parse(found.request.requestedAt)
  )
    throw new Error("Decision time precedes the request.")
  const revision =
    outcome === "approved"
      ? proposedRevision(s, found.record, found.request)
      : undefined
  const decided: CorrectionRequest = {
    ...found.request,
    status: outcome,
    decision: {
      reviewerId,
      reviewerName: s.staff.find((e) => e.id === reviewerId)!.name,
      at,
      notes: notes.trim(),
      revision: revision ? structuredClone(revision) : undefined,
    },
  }
  return {
    ...s,
    now: at,
    corrections: s.corrections.map((c) => (c.id === id ? decided : c)),
  }
}
export function recordReviewSummary(s: StaffSnapshot, role: string) {
  const records = submittedRecords(s, role),
    requests = managedRequests(s, role)
  return {
    total: records.length,
    pending: requests.filter((x) => x.request.status === "pending").length,
    corrected: records.filter((r) => latestRevision(s, r.kind, r.id)).length,
    recent: records.filter((r) => {
      const revision = latestRevision(s, r.kind, r.id),
        at = requests.find((x) => x.request.id === revision?.requestId)?.request
          .decision?.at
      return at && Date.parse(s.now) - Date.parse(at) <= 7 * 86400000
    }).length,
    records,
    requests,
  }
}
export { effectiveDiary, effectiveCare }
