import { isStaffPreviewRole } from "../data/permissions"
import type { StaffSnapshot, Notice } from "../data/types"
import { me, myClients, myHouses, visibleNotices } from "../data/selectors"
import { validateFileSelection } from "../files/policy"
import type { Concern, ConcernInput } from "./types"
import type { FileRecord } from "../files/types"
export const isNoticeRead = (s: StaffSnapshot, id: string) =>
  s.notificationReads.some(
    (r) => r.employeeId === s.meId && r.notificationId === id,
  )
export const unreadCount = (s: StaffSnapshot) =>
  visibleNotices(s).filter((n) => !isNoticeRead(s, n.id)).length
export const getNotice = (s: StaffSnapshot, id: string) =>
  visibleNotices(s).find((n) => n.id === id)
export function markNoticeRead(
  s: StaffSnapshot,
  id: string,
  at: string,
): StaffSnapshot {
  if (!getNotice(s, id) || !Number.isFinite(Date.parse(at)))
    throw new Error("Notification unavailable")
  if (isNoticeRead(s, id)) return s
  return {
    ...s,
    notificationReads: [
      ...s.notificationReads,
      { notificationId: id, employeeId: s.meId, readAt: at },
    ],
  }
}
export function contextName(s: StaffSnapshot, context: string, id?: string) {
  return context === "client"
    ? myClients(s).find((c) => c.id === id)?.name
    : context === "house"
      ? myHouses(s).find((h) => h.id === id)?.name
      : undefined
}
export const canSubmitConcern = (
  s: StaffSnapshot,
  context: string,
  id: string,
) => !!me(s) && isStaffPreviewRole(me(s).role) && !!contextName(s, context, id)
/** Explicit projection strips internal/management-only properties even with a broader fixture. */
export function projectConcern(c: Concern): Concern {
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    context: c.context,
    targetId: c.targetId,
    priority: c.priority,
    submittedById: c.submittedById,
    submittedAt: c.submittedAt,
    status: c.status,
    response: c.response
      ? {
          reviewerName: c.response.reviewerName,
          text: c.response.text,
          at: c.response.at,
        }
      : undefined,
    resolvedAt: c.resolvedAt,
    attachmentIds: c.attachmentIds ? [...c.attachmentIds] : undefined,
  }
}
export const getMyConcerns = (s: StaffSnapshot) =>
  s.concerns
    .filter(
      (c) =>
        c.submittedById === s.meId &&
        canSubmitConcern(s, c.context, c.targetId),
    )
    .map(projectConcern)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
export const getConcern = (s: StaffSnapshot, id: string) =>
  getMyConcerns(s).find((c) => c.id === id)
export function validateConcern(s: StaffSnapshot, input: ConcernInput) {
  const errors: Partial<Record<keyof ConcernInput, string>> = {}
  if (!["client", "house"].includes(input.context))
    errors.context = "Choose Client or House."
  if (!canSubmitConcern(s, input.context, input.targetId))
    errors.targetId = "Select an authorised client or house."
  if (!input.title.trim()) errors.title = "Enter a short title."
  if (!input.description.trim()) errors.description = "Describe the concern."
  if (!["Low", "Medium", "High"].includes(input.priority))
    errors.priority = "Choose a valid priority."
  if (input.attachment)
    errors.attachment = validateFileSelection(input.attachment)
  return Object.fromEntries(
    Object.entries(errors).filter(([, v]) => !!v),
  ) as typeof errors
}
export function submitConcern(
  s: StaffSnapshot,
  input: ConcernInput,
  id: string,
  at: string,
): StaffSnapshot {
  if (
    Object.keys(validateConcern(s, input)).length ||
    !id ||
    s.concerns.some((c) => c.id === id) ||
    !Number.isFinite(Date.parse(at))
  )
    throw new Error("Concern unavailable")
  const attachment: FileRecord | undefined = input.attachment
    ? {
        id: `concern-file-${id}`,
        name: input.attachment.name,
        mimeType: input.attachment.type,
        bytes: input.attachment.size,
        category: input.attachment.type.startsWith("image/")
          ? "image"
          : input.attachment.type === "application/pdf"
            ? "pdf"
            : "document",
        uploadedAt: at,
        uploadedById: s.meId,
        association: { scope: "concern", targetId: id },
        availability: "sessionOnly",
      }
    : undefined
  const concern: Concern = {
    id,
    title: input.title.trim(),
    description: input.description.trim(),
    context: input.context as Concern["context"],
    targetId: input.targetId,
    priority: input.priority as Concern["priority"],
    submittedById: s.meId,
    submittedAt: at,
    status: "Submitted",
    attachmentIds: attachment ? [attachment.id] : undefined,
  }
  return {
    ...s,
    concerns: [concern, ...s.concerns],
    attachments: attachment ? [...s.attachments, attachment] : s.attachments,
  }
}
export function getParentAttachments(
  s: StaffSnapshot,
  parent: Notice | Concern,
  scope: "notification" | "concern",
) {
  const allowed =
    scope === "notification"
      ? getNotice(s, parent.id)
      : getConcern(s, parent.id)
  return allowed
    ? s.attachments.filter(
        (f) =>
          f.association.scope === scope &&
          f.association.targetId === parent.id &&
          allowed.attachmentIds?.includes(f.id),
      )
    : []
}
export interface NotificationFilters {
  search?: string
  from?: string
  to?: string
  context?: string
  targetId?: string
  unread?: boolean
  status?: string
}
const dateKey = (date: string) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Pacific/Auckland",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date))
export function queryNotifications(
  s: StaffSnapshot,
  category: string,
  f: NotificationFilters = {},
) {
  return visibleNotices(s).filter(
    (n) =>
      (category === "all" || n.category === category) &&
      (!f.context ||
        (n.category === f.context && n.relatedId === f.targetId)) &&
      (!f.unread || !isNoticeRead(s, n.id)) &&
      (!f.from || dateKey(n.date) >= f.from) &&
      (!f.to || dateKey(n.date) <= f.to) &&
      `${n.title} ${n.body ?? ""} ${n.publisher} ${contextName(s, n.category, n.relatedId) ?? ""}`
        .toLowerCase()
        .includes((f.search ?? "").trim().toLowerCase()),
  )
}
export function queryConcerns(s: StaffSnapshot, f: NotificationFilters = {}) {
  return getMyConcerns(s).filter(
    (c) =>
      (!f.context || c.context === f.context) &&
      (!f.targetId || c.targetId === f.targetId) &&
      (!f.status || c.status === f.status) &&
      (!f.from || dateKey(c.submittedAt) >= f.from) &&
      (!f.to || dateKey(c.submittedAt) <= f.to) &&
      `${c.title} ${c.description} ${contextName(s, c.context, c.targetId)}`
        .toLowerCase()
        .includes((f.search ?? "").trim().toLowerCase()),
  )
}
