import type {
  StaffSnapshot,
  DiaryCategory,
  DiaryScope,
} from "../../staff/data/types"
import type { CareTemplate, TemplateDraft } from "../../staff/care/types"
import { requireManagement } from "../data/adapter"
import { assertDraftShape, validKey, validateTemplate } from "./validation"
const clone = <T>(v: T): T => structuredClone(v)
export function metadata(s: StaffSnapshot, role: string) {
  requireManagement(role)
  if (!s.organisation?.id) throw new Error("Organisation preview unavailable.")
  return { updatedAt: s.now, updatedBy: role === "Administrator" ? "a1" : "m1" }
}
function find(s: StaffSnapshot, role: string, id: string) {
  metadata(s, role)
  const t = s.careTemplates.find((t) => t.id === id)
  if (!validKey(id) || !t) throw new Error("Template unavailable.")
  return t
}
function replace(s: StaffSnapshot, t: CareTemplate): StaffSnapshot {
  return {
    ...s,
    careTemplates: s.careTemplates.map((x) => (x.id === t.id ? t : x)),
  }
}
export interface CategoryInput {
  name: string
  description: string
  scope: DiaryScope
  active: boolean
}
export function saveCategory(
  s: StaffSnapshot,
  role: string,
  input: CategoryInput,
  id?: string,
): StaffSnapshot {
  const meta = metadata(s, role),
    old = s.diaryCategories.find((c) => c.id === id)
  if (
    (id !== undefined && (!validKey(id) || !old)) ||
    !input ||
    typeof input.name !== "string" ||
    !input.name.trim() ||
    input.name.length > 160 ||
    typeof input.description !== "string" ||
    input.description.length > 2000 ||
    !["client", "house"].includes(input.scope) ||
    typeof input.active !== "boolean" ||
    Object.keys(input).some(
      (k) => !["name", "description", "scope", "active"].includes(k),
    )
  )
    throw new Error("Enter valid category details and context.")
  if (old && old.scope !== input.scope)
    throw new Error("A category's diary context is fixed.")
  if (
    input.active &&
    s.diaryCategories.some(
      (c) =>
        c.id !== id &&
        c.active &&
        c.scope === input.scope &&
        c.name.trim().toLowerCase() === input.name.trim().toLowerCase(),
    )
  )
    throw new Error(
      "An active category with this name already exists in this context.",
    )
  const category: DiaryCategory = {
    ...old,
    ...input,
    name: input.name.trim(),
    description: input.description.trim(),
    id: id ?? crypto.randomUUID(),
    createdAt: old?.createdAt ?? s.now,
    createdBy: old?.createdBy ?? meta.updatedBy,
    ...meta,
  }
  // Freeze labels of legacy records before a category rename; no record ID/value is replaced.
  const diary =
    old && old.name !== category.name
      ? s.diary.map((d) =>
          d.categoryId === old.id && d.status !== "draft" && !d.categoryName
            ? { ...d, categoryName: old.name }
            : d,
        )
      : s.diary
  return {
    ...s,
    diary,
    diaryCategories: old
      ? s.diaryCategories.map((c) => (c.id === id ? category : c))
      : [...s.diaryCategories, category],
  }
}
export function createTemplate(
  s: StaffSnapshot,
  role: string,
  name: string,
  description: string,
  kind: CareTemplate["kind"],
) {
  const meta = metadata(s, role)
  if (
    typeof name !== "string" ||
    !name.trim() ||
    name.length > 160 ||
    typeof description !== "string" ||
    description.length > 4000 ||
    !["care", "chart"].includes(kind)
  )
    throw new Error("Enter a valid name and documentation type.")
  const id = crypto.randomUUID()
  const t: CareTemplate = {
    id,
    name: name.trim(),
    description: description.trim(),
    kind,
    versions: [],
    draft: {
      name: name.trim(),
      description: description.trim(),
      summary: "",
      form: { version: 1, published: false, sections: [] },
    },
    createdAt: s.now,
    createdBy: meta.updatedBy,
    ...meta,
  }
  return { data: { ...s, careTemplates: [...s.careTemplates, t] }, id }
}
export function saveDraft(
  s: StaffSnapshot,
  role: string,
  id: string,
  draft: TemplateDraft,
) {
  const t = find(s, role, id)
  if (!t.draft || t.archived)
    throw new Error("Create a new draft version before editing.")
  assertDraftShape(draft)
  if (draft.form.version !== t.draft.form.version)
    throw new Error("Draft version conflict.")
  return replace(s, { ...t, draft: clone(draft), ...metadata(s, role) })
}
export function publishTemplate(
  s: StaffSnapshot,
  role: string,
  id: string,
  confirmed: boolean,
) {
  const t = find(s, role, id),
    d = t.draft
  if (confirmed !== true || !d || t.archived)
    throw new Error("Confirm an editable draft publication.")
  const errors = validateTemplate(d)
  if (errors.length) throw new Error(errors.map((e) => e.message).join(" "))
  if (
    t.versions.some((v) => v.version === d.form.version) ||
    d.form.version !== Math.max(0, ...t.versions.map((v) => v.version)) + 1
  )
    throw new Error("Publication version conflict.")
  const meta = metadata(s, role)
  return replace(s, {
    ...t,
    legacyMetadata:
      t.legacyMetadata ??
      (t.versions.some((v) => !v.name)
        ? { name: t.name, description: t.description }
        : undefined),
    name: d.name.trim(),
    description: d.description.trim(),
    history: t.history,
    draft: undefined,
    versions: [
      ...t.versions,
      {
        ...clone(d.form),
        history: clone(d.history),
        name: d.name.trim(),
        description: d.description.trim(),
        published: true,
        publishedAt: s.now,
        publishedBy: meta.updatedBy,
        summary: d.summary.trim(),
      },
    ],
    ...meta,
  })
}
export function newDraftVersion(
  s: StaffSnapshot,
  role: string,
  id: string,
  versionNumber?: number,
) {
  const t = find(s, role, id)
  if (t.draft || t.archived)
    throw new Error(
      "An editable draft already exists or the template is archived.",
    )
  const source = t.versions.find(
    (v) =>
      v.version ===
      (versionNumber ?? Math.max(...t.versions.map((v) => v.version))),
  )
  if (!source?.published) throw new Error("Published version unavailable.")
  return replace(s, {
    ...t,
    draft: {
      name: source.name ?? t.legacyMetadata?.name ?? t.name,
      description:
        source.description ?? t.legacyMetadata?.description ?? t.description,
      summary: "",
      history: clone(source.name ? source.history : t.history),
      form: {
        ...clone(source),
        published: false,
        version: Math.max(...t.versions.map((v) => v.version)) + 1,
        publishedAt: undefined,
        publishedBy: undefined,
        summary: undefined,
      },
    },
    ...metadata(s, role),
  })
}
export function archiveTemplate(
  s: StaffSnapshot,
  role: string,
  id: string,
  confirmed: boolean,
) {
  const t = find(s, role, id)
  if (
    confirmed !== true ||
    s.careAssignments.some((a) => a.templateId === id && a.status === "active")
  )
    throw new Error(
      "Deactivate all client assignments and confirm before archiving.",
    )
  return replace(s, { ...t, archived: true, ...metadata(s, role) })
}
export function assignTemplate(
  s: StaffSnapshot,
  role: string,
  templateId: string,
  clientId: string,
  version: number,
  action: "assign" | "update" | "deactivate",
): StaffSnapshot {
  const t = find(s, role, templateId),
    client = s.clients.find((c) => c.id === clientId),
    old = s.careAssignments.find(
      (a) => a.clientId === clientId && a.templateId === templateId,
    )
  if (
    !client ||
    !s.houses.some((h) => h.id === client.houseId) ||
    !["assign", "update", "deactivate"].includes(action)
  )
    throw new Error("Client assignment unavailable in this organisation.")
  if (action === "deactivate") {
    if (!old || old.status !== "active")
      throw new Error("Active assignment unavailable.")
  } else {
    if (
      t.archived ||
      client.status === "Inactive" ||
      !s.houses.some(
        (h) => h.id === client.houseId && h.status !== "Inactive",
      ) ||
      !t.versions.some((v) => v.version === version && v.published)
    )
      throw new Error("Choose an active client and published version.")
    if (action === "assign" && old?.status === "active")
      throw new Error(
        "An active assignment already exists. Use explicit Update version.",
      )
    if (
      action === "update" &&
      (!old || old.status !== "active" || old.version === version)
    )
      throw new Error(
        "Choose a different published version for an active assignment.",
      )
  }
  const row = {
    clientId,
    templateId,
    version: action === "deactivate" ? old!.version : version,
    status: action === "deactivate" ? "paused" as const : "active" as const,
    ...metadata(s, role),
  }
  return {
    ...s,
    careAssignments: [
      ...s.careAssignments.filter(
        (a) => !(a.clientId === clientId && a.templateId === templateId),
      ),
      row,
    ],
  }
}
