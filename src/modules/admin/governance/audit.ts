import type { StaffSnapshot } from "../../staff/data/types"
import { reviewActor } from "../records/adapter"
export interface DevelopmentEvent {
  id: string
  at: string
  actor: string
  action: string
  entity: string
  targetId: string
  before?: string
  after?: string
}
/** Derived only from metadata actually present; not an independent or durable audit store. */
export default function developmentEvents(
  s: StaffSnapshot,
  role: string,
): DevelopmentEvent[] {
  reviewActor(s, role)
  const events: DevelopmentEvent[] = []
  const name = (id?: string) =>
    s.staff.find((e) => e.id === id)?.name ?? id ?? "Not supplied"
  for (const f of s.attachments)
    if (f.removed)
      events.push({
        id: `file-${f.id}`,
        at: f.removed.at,
        actor: f.removed.byName,
        action: "Logical file removal",
        entity: "File",
        targetId: f.id,
        before: "Listed",
        after: "Removed from ordinary Staff galleries",
      })
  for (const n of s.notices)
    for (const e of n.history ?? [])
      events.push({
        id: `notice-${e.id}`,
        at: e.at,
        actor: e.actorName,
        action: `Notice ${e.action.toLowerCase()}`,
        entity: "Notice",
        targetId: n.id,
        before: e.previous?.status,
        after: e.action === "Draft saved" ? "Draft" : e.action,
      })
  for (const c of s.concerns)
    for (const e of c.reviewEvents ?? [])
      events.push({
        id: `concern-${e.id}`,
        at: e.at,
        actor: e.reviewerName,
        action: e.action,
        entity: "Concern",
        targetId: c.id,
        before: e.before,
        after: e.after,
      })
  for (const c of s.corrections)
    if (c.decision)
      events.push({
        id: `record-${c.id}`,
        at: c.decision.at,
        actor: c.decision.reviewerName ?? name(c.decision.reviewerId),
        action: `Record correction ${c.status.toLowerCase()}`,
        entity: "Care correction",
        targetId: c.id,
        after: c.status,
      })
  for (const c of s.attendanceCorrections)
    if (c.decision)
      events.push({
        id: `attendance-${c.id}`,
        at: c.decision.decidedAt,
        actor: name(c.decision.reviewerId),
        action: `Attendance correction ${c.status}`,
        entity: "Attendance correction",
        targetId: c.id,
        after: c.status,
      })
  for (const l of s.leaveRequests)
    if (l.decision)
      events.push({
        id: `leave-${l.id}`,
        at: l.decision.decidedAt,
        actor: l.decision.reviewerName ?? name(l.decision.reviewerId),
        action: `Leave ${l.status}`,
        entity: "Leave",
        targetId: l.id,
        after: l.status,
      })
  for (const t of s.careTemplates) {
    if (t.updatedAt && t.updatedBy)
      events.push({
        id: `template-${t.id}`,
        at: t.updatedAt,
        actor: name(t.updatedBy),
        action: "Latest template update",
        entity: "Template",
        targetId: t.id,
      })
    for (const v of t.versions)
      if (v.publishedAt && v.publishedBy)
        events.push({
          id: `version-${t.id}-${v.version}`,
          at: v.publishedAt,
          actor: name(v.publishedBy),
          action: `Template v${v.version} published`,
          entity: "Template",
          targetId: t.id,
        })
  }
  for (const c of s.diaryCategories)
    if (c.updatedAt && c.updatedBy)
      events.push({
        id: `category-${c.id}`,
        at: c.updatedAt,
        actor: name(c.updatedBy),
        action: "Latest category update",
        entity: "Diary category",
        targetId: c.id,
      })
  return events
    .filter((e) => Number.isFinite(Date.parse(e.at)))
    .sort((a, b) => b.at.localeCompare(a.at))
}
