import type { StaffSnapshot, CorrectionTarget } from "../data/types"
import type { CareRecord } from "../care/types"
import type { FormFieldDefinition, FormValue } from "../../forms/types"
import {
  allFields,
  isTableRows,
  initialFormValues,
  validateForm,
  normalizeFormValues,
  visibleFields,
} from "../../forms/engine"
import { effectiveCare } from "./revisions"
import type { CorrectionProposal } from "./revisions"
const safe = (v: unknown): v is string =>
  typeof v === "string" &&
  /^[a-zA-Z0-9_-]{1,120}$/.test(v) &&
  !["__proto__", "constructor", "prototype"].includes(v)
export function proposalField(
  s: StaffSnapshot,
  r: CareRecord,
  target: CorrectionTarget,
): FormFieldDefinition {
  const version = s.careTemplates
    .find((t) => t.id === r.templateId)
    ?.versions.find((v) => v.version === r.templateVersion && v.published)
  if (
    !version ||
    !target ||
    !safe(target.fieldId) ||
    Object.keys(target).some(
      (k) => !["fieldId", "rowId", "columnId"].includes(k),
    )
  )
    throw new Error("Original correction reference unavailable.")
  const field = allFields(version).find((f) => f.id === target.fieldId)
  if (!field || ["photo", "file", "table"].includes(field.type))
    throw new Error("Unsupported correction field.")
  if (target.rowId !== undefined || target.columnId !== undefined) {
    const rows = effectiveCare(s, r).values[field.id]
    if (
      field.type !== "repeatingTable" ||
      !safe(target.rowId) ||
      !safe(target.columnId) ||
      !isTableRows(rows) ||
      rows.filter((row) => row.id === target.rowId).length !== 1
    )
      throw new Error("Original table row unavailable.")
    const column = field.columns.find((c) => c.id === target.columnId)
    if (!column || ["photo", "file"].includes(column.type))
      throw new Error("Original table column unavailable.")
    return {
      ...column,
      id: field.id,
      label: `${field.label} · row ${target.rowId} · ${column.label}`,
    }
  }
  if (
    field.type === "repeatingTable" &&
    field.columns.some((c) => ["photo", "file"].includes(c.type))
  )
    throw new Error("Unsupported correction table columns.")
  return field
}
export function applyCareProposal(
  s: StaffSnapshot,
  r: CareRecord,
  proposal: CorrectionProposal,
) {
  if (
    proposal.kind !== "care" ||
    Object.keys(proposal).some((k) => !["kind", "changes"].includes(k)) ||
    !Array.isArray(proposal.changes) ||
    !proposal.changes.length ||
    proposal.changes.length > 100
  )
    throw new Error(
      "A typed structured proposal is required; text is never parsed into answers.",
    )
  const version = s.careTemplates
    .find((t) => t.id === r.templateId)
    ?.versions.find((v) => v.version === r.templateVersion && v.published)
  if (!version) throw new Error("Original published version unavailable.")
  const values = structuredClone(effectiveCare(s, r).values),
    seen = new Set<string>()
  for (const change of proposal.changes) {
    if (
      !change ||
      Object.keys(change).some((k) => !["target", "value"].includes(k))
    )
      throw new Error("Invalid proposed change.")
    const f = proposalField(s, r, change.target),
      key = `${change.target.fieldId}:${change.target.rowId ?? ""}:${change.target.columnId ?? ""}`
    if (seen.has(key)) throw new Error("Duplicate correction target.")
    seen.add(key)
    const scalarVersion = {
      version: version.version,
      published: true,
      sections: [
        {
          id: "proposal",
          title: "Proposal",
          fields: [{ ...f, required: false, showIf: undefined }],
        },
      ],
    }
    const checked = initialFormValues(scalarVersion, { [f.id]: change.value })
    if (Object.keys(validateForm(scalarVersion, checked)).length)
      throw new Error(`Invalid proposed value: ${f.label}.`)
    // Never allow sanitisation to silently discard unknown table columns or malformed rows.
    if (f.type === "repeatingTable") {
      if (
        !isTableRows(change.value) ||
        change.value.some(
          (row: import("../../forms/types").CareTableRow) =>
            !safe(row.id) ||
            Object.keys(row.values).some(
              (k) => !f.columns.some((c) => c.id === k),
            ),
        )
      )
        throw new Error("Invalid table row or column values.")
    }
    const value: FormValue =
      normalizeFormValues(scalarVersion, checked)[f.id] ?? ""
    if (change.target.rowId) {
      const rows = values[change.target.fieldId]
      if (
        !isTableRows(rows) ||
        (typeof value !== "string" && typeof value !== "number")
      )
        throw new Error("Invalid table cell value.")
      values[change.target.fieldId] = rows.map((row) =>
        row.id === change.target.rowId
          ? {
              ...row,
              values: { ...row.values, [change.target.columnId!]: value },
            }
          : row,
      )
    } else values[f.id] = value
  }
  const visible = new Set(visibleFields(version, values).map((f) => f.id))
  // A correction cannot silently clear dependent historical answers; request explicit changes instead.
  if (
    Object.keys(values).some(
      (id) =>
        allFields(version).some((f) => f.id === id) &&
        !visible.has(id) &&
        values[id] !== "" &&
        !(Array.isArray(values[id]) && !values[id].length) &&
        JSON.stringify(values[id]) !==
          JSON.stringify(effectiveCare(s, r).values[id]),
    )
  )
    throw new Error("Proposed changes target a hidden answer.")
  if (
    allFields(version).some(
      (f) =>
        !visible.has(f.id) &&
        effectiveCare(s, r).values[f.id] !== undefined &&
        values[f.id] !== "" &&
        (!Array.isArray(values[f.id]) || (values[f.id] as unknown[]).length),
    )
  )
    throw new Error(
      "This change hides an existing answer. Explicitly clear it in the same proposal; no historical value is silently removed.",
    )
  if (
    Object.keys(validateForm(version, initialFormValues(version, values)))
      .length
  )
    throw new Error(
      "Proposed effective record does not satisfy its original version.",
    )
  if (JSON.stringify(values) === JSON.stringify(effectiveCare(s, r).values))
    throw new Error("Propose at least one changed answer.")
  return values
}
