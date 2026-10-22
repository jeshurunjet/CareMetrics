import type { StaffSnapshot } from "../data/types"
import type { CareRecordInput, CareRecord } from "./types"
import { getClient } from "../data/queries"
import { isDemoOnShift } from "../data/diary-adapter"
import {
  validateForm,
  normalizeFormValues,
  initialFormValues,
} from "../../forms/engine"
import {
  canRequestRecordCorrection,
  appendCorrectionRequest,
} from "../data/correction-service"
export function getAssignedCareTemplates(s: StaffSnapshot, clientId: string) {
  if (!getClient(s, clientId)) return []
  return s.careAssignments
    .filter((a) => a.clientId === clientId && a.status === "active")
    .flatMap((a) => {
      const template = s.careTemplates.find(
          (t) => t.id === a.templateId && t.kind === "care",
        ),
        version = template?.versions.find(
          (v) => v.version === a.version && v.published,
        )
      return template && version ? [{ template, version }] : []
    })
}
export const getAssignedCareTemplate = (
  s: StaffSnapshot,
  clientId: string,
  templateId: string,
) =>
  getAssignedCareTemplates(s, clientId).find(
    (t) => t.template.id === templateId,
  )
export function getCareRecords(
  s: StaffSnapshot,
  clientId: string,
  templateId: string,
) {
  const assigned = getAssignedCareTemplate(s, clientId, templateId)
  if (!assigned) return []
  return s.careRecords
    .filter(
      (r) =>
        r.clientId === clientId &&
        r.templateId === templateId &&
        (r.status !== "draft" || r.authorId === s.meId) &&
        assigned.template.versions.some(
          (v) => v.version === r.templateVersion && v.published,
        ),
    )
    .sort((a, b) =>
      (b.submittedAt ?? b.createdAt).localeCompare(
        a.submittedAt ?? a.createdAt,
      ),
    )
}
export const getCareRecord = (
  s: StaffSnapshot,
  clientId: string,
  templateId: string,
  id: string,
) => getCareRecords(s, clientId, templateId).find((r) => r.id === id)
export function queryCareHistory(
  s: StaffSnapshot,
  clientId: string,
  templateId: string,
  filters: {
    query?: string
    days?: number
    page?: number
  } = {},
) {
  const query = filters.query?.trim().toLowerCase()
  const list = getCareRecords(s, clientId, templateId)
    .filter(
      (r) =>
        !query ||
        `${JSON.stringify(r.values)} ${s.staff.find((e) => e.id === r.authorId)?.name ?? ""}`
          .toLowerCase()
          .includes(query),
    )
    .filter(
      (r) =>
        filters.days === undefined ||
        (Date.parse(s.now) - Date.parse(r.coveredAt) >= 0 &&
          Date.parse(s.now) - Date.parse(r.coveredAt) <=
            filters.days * 86400000),
    )
  const page = Math.max(
    1,
    Math.min(filters.page ?? 1, Math.max(1, Math.ceil(list.length / 6))),
  )
  return {
    items: list.slice((page - 1) * 6, page * 6),
    total: list.length,
    page,
    per: 6,
  }
}
export function validateCareInput(
  s: StaffSnapshot,
  clientId: string,
  templateId: string,
  versionNumber: number,
  input: CareRecordInput,
  status: "draft" | "submitted",
) {
  const assigned = getAssignedCareTemplate(s, clientId, templateId),
    version = assigned?.template.versions.find(
      (v) => v.version === versionNumber && v.published,
    )
  if (!version) return { form: "Assessment unavailable" }
  const errors: Record<string, string> =
    status === "submitted"
      ? validateForm(version, initialFormValues(version, input.values))
      : {}
  if (status === "submitted") {
    if (
      !Number.isFinite(Date.parse(input.coveredAt)) ||
      Date.parse(input.coveredAt) > Date.parse(s.now)
    )
      errors.coveredAt = "Choose a valid covered time, no later than now."
    if (!isDemoOnShift(s) && !input.offShiftReason.trim())
      errors.offShiftReason =
        "A reason is required when you are not clocked in."
  }
  return errors
}
export function saveCareRecord(
  s: StaffSnapshot,
  clientId: string,
  templateId: string,
  input: CareRecordInput,
  status: "draft" | "submitted",
  id: string,
  now: string,
  draftId?: string,
): StaffSnapshot {
  const assigned = getAssignedCareTemplate(s, clientId, templateId)
  if (!assigned) throw new Error("Assessment unavailable")
  const existing = draftId
    ? getCareRecord(s, clientId, templateId, draftId)
    : undefined
  if (
    draftId &&
    (!existing || existing.status !== "draft" || existing.authorId !== s.meId)
  )
    throw new Error("Only your own drafts may be edited")
  const versionNumber = existing?.templateVersion ?? assigned.version.version
  const version = assigned.template.versions.find(
    (v) => v.version === versionNumber && v.published,
  )!
  const errors = validateCareInput(
    { ...s, now },
    clientId,
    templateId,
    versionNumber,
    input,
    status,
  )
  if (Object.keys(errors).length)
    throw new Error(Object.values(errors).join(" "))
  if (!existing && s.careRecords.some((r) => r.id === id))
    throw new Error("Duplicate assessment ID")
  const record: CareRecord = {
    id: existing?.id ?? id,
    clientId,
    templateId,
    templateVersion: versionNumber,
    authorId: s.meId,
    values: normalizeFormValues(
      version,
      initialFormValues(version, input.values),
    ),
    coveredAt: input.coveredAt || now,
    createdAt: existing?.createdAt ?? now,
    submittedAt: status === "submitted" ? now : undefined,
    status,
    offShiftReason: input.offShiftReason.trim() || undefined,
  }
  return {
    ...s,
    careRecords: [record, ...s.careRecords.filter((r) => r.id !== record.id)],
  }
}
export const canRequestCareCorrection = (s: StaffSnapshot, r: CareRecord) =>
  !!getCareRecord(s, r.clientId, r.templateId, r.id) &&
  canRequestRecordCorrection(s, "care", r.id, r.authorId, r.status)
export function requestCareCorrection(
  s: StaffSnapshot,
  clientId: string,
  templateId: string,
  id: string,
  reason: string,
  proposed: string,
  requestId: string,
  now: string,
) {
  const record = getCareRecord(s, clientId, templateId, id)
  if (!record || !canRequestCareCorrection(s, record))
    throw new Error("Correction unavailable")
  return appendCorrectionRequest(
    s,
    "care",
    id,
    reason,
    proposed,
    requestId,
    now,
  )
}
export const careQueries = {
  getAssignedCareTemplates,
  getAssignedCareTemplate,
  getCareRecords,
  getCareRecord,
  queryCareHistory,
  saveCareRecord,
  requestCareCorrection,
}
