/** Pure fictional development transitions. No server identity, storage, delivery or persistence. */
import type { StaffSnapshot, Notice } from "../../staff/data/types"
import type {
  GallerySubject,
  FileSelectionMetadata,
} from "../../staff/files/types"
import type {
  ConcernStatus,
  NoticeAudience,
  NoticeCategory,
  NoticePriority,
} from "../../staff/notifications/types"
import { reviewActor } from "../records/adapter"
import { validateFileSelection } from "../../staff/files/policy"
export function actor(s: StaffSnapshot, role: string, at: string) {
  const id = reviewActor(s, role)
  if (!Number.isFinite(Date.parse(at)))
    throw new Error("Invalid development event time.")
  return s.staff.find((e) => e.id === id)!
}
export function subjectName(s: StaffSnapshot, subject: GallerySubject) {
  if (subject.scope !== "client" && subject.scope !== "house") return undefined
  if (subject.scope === "client") {
    const c = s.clients.find((c) => c.id === subject.targetId)
    return c && s.houses.some((h) => h.id === c.houseId) ? c.name : undefined
  }
  return s.houses.find((h) => h.id === subject.targetId)?.name
}
export function managedFiles(s: StaffSnapshot, role: string) {
  reviewActor(s, role)
  return s.attachments.filter(
    (f) =>
      (f.association.scope === "client" || f.association.scope === "house") &&
      subjectName(s, f.association as GallerySubject) &&
      s.staff.some((e) => e.id === f.uploadedById),
  )
}
export function removeFile(
  s: StaffSnapshot,
  role: string,
  id: string,
  reason: string,
  at: string,
): StaffSnapshot {
  const by = actor(s, role, at),
    f = managedFiles(s, role).find((f) => f.id === id)
  if (!f || f.removed) throw new Error("File unavailable or already removed.")
  if (typeof reason !== "string" || !reason.trim() || reason.length > 2000)
    throw new Error("Enter a removal reason (up to 2000 characters).")
  if (Date.parse(at) < Date.parse(f.uploadedAt))
    throw new Error("Removal cannot precede upload.")
  return {
    ...s,
    now: at,
    attachments: s.attachments.map((x) =>
      x.id === id
        ? {
            ...x,
            removed: {
              byId: by.id,
              byName: by.name,
              at,
              reason: reason.trim(),
            },
          }
        : x,
    ),
  }
}
export function addManagementFiles(
  s: StaffSnapshot,
  role: string,
  subject: GallerySubject,
  selections: readonly FileSelectionMetadata[],
  at: string,
): StaffSnapshot {
  const by = actor(s, role, at)
  if (!subjectName(s, subject) || !selections.length)
    throw new Error("Gallery unavailable.")
  const ids = new Set(s.attachments.map((f) => f.id))
  const additions = selections.map((f) => {
    const error = validateFileSelection(f)
    if (error || !f.id || ids.has(f.id) || (f.description?.length ?? 0) > 2000)
      throw new Error(error || "Invalid file metadata.")
    ids.add(f.id)
    return {
      id: f.id,
      name: f.name,
      description: f.description?.trim(),
      mimeType: f.type,
      bytes: f.size,
      category: f.type.startsWith("image/")
        ? "image" as const
        : f.type === "application/pdf"
          ? "pdf" as const
          : "document" as const,
      uploadedAt: at,
      uploadedById: by.id,
      association: { ...subject },
      availability: "sessionOnly" as const,
    }
  })
  return { ...s, now: at, attachments: [...additions, ...s.attachments] }
}
export interface NoticeInput {
  title: string
  body: string
  category: NoticeCategory
  priority: NoticePriority
  relatedId?: string
  targetAudience: NoticeAudience
}
export function validateNotice(
  s: StaffSnapshot,
  input: NoticeInput,
  publishing = true,
) {
  if (
    !input ||
    typeof input !== "object" ||
    Object.keys(input).some(
      (k) =>
        ![
          "title",
          "body",
          "category",
          "priority",
          "relatedId",
          "targetAudience",
        ].includes(k),
    )
  )
    throw new Error("Invalid notice fields.")
  if (
    typeof input.title !== "string" ||
    !input.title.trim() ||
    input.title.length > 200 ||
    typeof input.body !== "string" ||
    input.body.length > 4000 ||
    (publishing && !input.body.trim())
  )
    throw new Error(
      "Enter a title (up to 200 characters) and message (up to 4000 characters).",
    )
  if (
    !["staff", "client", "house"].includes(input.category) ||
    !["Normal", "Important", "Urgent"].includes(input.priority)
  )
    throw new Error("Invalid notice type or priority.")
  if (
    input.category === "staff"
      ? !!input.relatedId
      : !subjectName(s, {
          scope: input.category,
          targetId: input.relatedId ?? "",
        })
  )
    throw new Error("Choose a valid notice association.")
  const a = input.targetAudience
  if (!a || typeof a !== "object") throw new Error("Choose a valid audience.")
  const keys: Record<string, string[]> = {
    organisation: ["kind"],
    employee: ["kind", "employeeId"],
    house: ["kind", "houseId"],
    client: ["kind", "clientId"],
    role: ["kind", "role"],
  }
  if (!keys[a.kind] || Object.keys(a).some((k) => !keys[a.kind].includes(k)))
    throw new Error("Invalid audience configuration.")
  const valid =
    a.kind === "organisation" ||
    (a.kind === "employee" &&
      s.staff.some((e) => e.id === a.employeeId && e.status !== "Inactive")) ||
    (a.kind === "house" &&
      s.houses.some((h) => h.id === a.houseId && h.status !== "Inactive")) ||
    (a.kind === "client" &&
      s.clients.some((c) => c.id === a.clientId && c.status !== "Inactive")) ||
    (a.kind === "role" && s.staff.some((e) => e.role === a.role))
  if (
    !valid ||
    (input.category === "client" &&
      a.kind !== "employee" &&
      !(a.kind === "client" && a.clientId === input.relatedId)) ||
    (input.category === "house" &&
      a.kind !== "employee" &&
      !(a.kind === "house" && a.houseId === input.relatedId)) ||
    (input.category === "staff" && a.kind === "client")
  )
    throw new Error("Audience must match the notice context.")
  if (a.kind === "employee" && input.category !== "staff") {
    const houseId =
      input.category === "house"
        ? input.relatedId
        : s.clients.find((c) => c.id === input.relatedId)?.houseId
    if (
      !s.assignments.some(
        (x) => x.employeeId === a.employeeId && x.houseId === houseId,
      )
    )
      throw new Error(
        "The selected employee is not assigned to this notice context.",
      )
  }
}
export function saveNotice(
  s: StaffSnapshot,
  role: string,
  id: string,
  input: NoticeInput,
  status: "Draft" | "Published",
  at: string,
): StaffSnapshot {
  const by = actor(s, role, at)
  if (!id || !["Draft", "Published"].includes(status))
    throw new Error("Invalid notice.")
  const old = s.notices.find((n) => n.id === id)
  if (old && old.status !== "Draft")
    throw new Error(
      "Published or withdrawn notices are read-only. Create a separate notice.",
    )
  validateNotice(s, input, status === "Published")
  if (old && Date.parse(at) < Date.parse(old.date))
    throw new Error("Notice event cannot precede its previous update.")
  const previous = old
    ? {
        title: old.title,
        body: old.body,
        status: old.status,
        targetAudience: structuredClone(old.targetAudience),
        category: old.category,
        relatedId: old.relatedId,
        priority: old.priority,
      }
    : undefined
  const notice: Notice = {
    ...old,
    ...structuredClone(input),
    id,
    title: input.title.trim(),
    body: input.body.trim(),
    date: at,
    publisher: by.name,
    publisherId: by.id,
    createdById: old?.createdById ?? by.id,
    createdAt: old?.createdAt ?? at,
    status,
    history: [
      ...(old?.history ?? []),
      {
        id: `${id}-event-${old?.history?.length ?? 0}`,
        actorId: by.id,
        actorName: by.name,
        at,
        action: status === "Draft" ? "Draft saved" : "Published",
        previous,
      },
    ],
  }
  return {
    ...s,
    now: at,
    notices: old
      ? s.notices.map((n) => (n.id === id ? notice : n))
      : [...s.notices, notice],
  }
}
export function withdrawNotice(
  s: StaffSnapshot,
  role: string,
  id: string,
  at: string,
): StaffSnapshot {
  const by = actor(s, role, at),
    n = s.notices.find((n) => n.id === id)
  if (!n || n.status !== "Published" || Date.parse(at) < Date.parse(n.date))
    throw new Error("Published notice unavailable.")
  return {
    ...s,
    now: at,
    notices: s.notices.map((x) =>
      x.id === id
        ? {
            ...x,
            status: "Withdrawn",
            history: [
              ...(x.history ?? []),
              {
                id: `${id}-event-${x.history?.length ?? 0}`,
                actorId: by.id,
                actorName: by.name,
                at,
                action: "Withdrawn",
                previous: {
                  title: x.title,
                  body: x.body,
                  status: x.status,
                  targetAudience: structuredClone(x.targetAudience),
                  category: x.category,
                  relatedId: x.relatedId,
                  priority: x.priority,
                },
              },
            ],
          }
        : x,
    ),
  }
}
export function audienceLabel(
  s: StaffSnapshot,
  n: Pick<Notice, "targetAudience"> & Partial<Pick<Notice, "category" | "relatedId">>,
) {
  const a = n.targetAudience
  if (a.kind === "organisation" && n.category === "client" && n.relatedId)
    return `Authorised staff · ${s.clients.find((c) => c.id === n.relatedId)?.name ?? "Unavailable client"}`
  if (a.kind === "organisation" && n.category === "house" && n.relatedId)
    return `Assigned staff · ${s.houses.find((h) => h.id === n.relatedId)?.name ?? "Unavailable house"}`
  return a.kind === "organisation"
    ? "Organisation staff"
    : a.kind === "employee"
      ? (s.staff.find((e) => e.id === a.employeeId)?.name ??
        "Unavailable employee")
      : a.kind === "house"
        ? `Assigned staff · ${s.houses.find((h) => h.id === a.houseId)?.name ?? "Unavailable house"}`
        : a.kind === "client"
          ? `Authorised staff · ${s.clients.find((c) => c.id === a.clientId)?.name ?? "Unavailable client"}`
          : `Role · ${a.role}`
}
export function managedConcerns(s: StaffSnapshot, role: string) {
  reviewActor(s, role)
  return s.concerns.filter(
    (c) =>
      subjectName(s, { scope: c.context, targetId: c.targetId }) &&
      s.staff.some((e) => e.id === c.submittedById),
  )
}
export type ConcernAction = {
  kind: "status"
  status: ConcernStatus
  text?: string
} | {
  kind: "internal" | "response"
  text: string
}
export function reviewConcern(
  s: StaffSnapshot,
  role: string,
  id: string,
  action: ConcernAction,
  at: string,
): StaffSnapshot {
  const by = actor(s, role, at),
    c = managedConcerns(s, role).find((c) => c.id === id)
  if (
    !c ||
    Date.parse(at) < Date.parse(c.reviewEvents?.at(-1)?.at ?? c.submittedAt)
  )
    throw new Error(
      "Concern unavailable or event time is earlier than its history.",
    )
  if (
    !action ||
    !["status", "internal", "response"].includes(action.kind) ||
    typeof (action.text ?? "") !== "string" ||
    (action.text?.length ?? 0) > 4000
  )
    throw new Error("Invalid review action.")
  if (action.kind !== "status" && !action.text.trim())
    throw new Error("Enter review text.")
  const next = action.kind === "status" ? action.status : c.status
  const allowed: Record<ConcernStatus, ConcernStatus[]> = {
    Submitted: ["Under Review", "Resolved"],
    "Under Review": ["Resolved"],
    Resolved: ["Closed", "Under Review"],
    Closed: ["Under Review"],
  }
  if (
    action.kind === "status" &&
    (!allowed[c.status]?.includes(next) ||
      (["Resolved", "Closed"].includes(next) && !action.text?.trim()))
  )
    throw new Error(
      "Choose a valid status transition and describe the outcome when resolving or closing.",
    )
  const event = {
    id: `${id}-review-${c.reviewEvents?.length ?? 0}`,
    reviewerId: by.id,
    reviewerName: by.name,
    at,
    action:
      action.kind === "status"
        ? next
        : action.kind === "internal"
          ? "Internal note"
          : "Staff-visible response",
    before: c.status,
    after: next,
    text: action.text?.trim(),
    visibility:
      action.kind === "internal" ? "internal" as const : "staff" as const,
  }
  return {
    ...s,
    now: at,
    concerns: s.concerns.map((x) =>
      x.id === id
        ? {
            ...x,
            status: next,
            reviewerId: by.id,
            reviewEvents: [...(x.reviewEvents ?? []), event],
            internalNotes:
              action.kind === "internal"
                ? [
                    ...(x.internalNotes ?? []),
                    {
                      reviewerId: by.id,
                      reviewerName: by.name,
                      at,
                      text: action.text.trim(),
                    },
                  ]
                : x.internalNotes,
            response:
              action.kind === "response" ||
              (action.kind === "status" && action.text?.trim())
                ? { reviewerName: by.name, at, text: action.text!.trim() }
                : x.response,
            resolvedAt:
              next === "Resolved" || next === "Closed"
                ? (x.resolvedAt ?? at)
                : undefined,
          }
        : x,
    ),
  }
}
