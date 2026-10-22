import type {
  ConfigurableFormVersion,
  FormValues,
  FormValue,
  VisibilityRule,
  FormFieldDefinition,
  RepeatingTableDefinition,
} from "./types"
import { fromNZDateTimeInput, toNZDateTimeInput } from "../../lib/time"
export const allFields = (version: ConfigurableFormVersion) =>
  version.sections.flatMap((s) => s.fields)
const empty = (v: FormValue | undefined) =>
  v === undefined ||
  v === "" ||
  (typeof v === "string" && !v.trim()) ||
  (Array.isArray(v) && !v.length)
/** Dependencies must themselves be visible. Cycles and missing controllers fail closed. */
export function visibleFields(
  version: ConfigurableFormVersion,
  values: FormValues,
) {
  const fields = allFields(version)
  const visible = (id: string, visiting: Set<string>): boolean => {
    if (visiting.has(id)) return false
    const field = fields.find((f) => f.id === id),
      section = version.sections.find((s) => s.fields.some((f) => f.id === id))
    if (!field || !section) return false
    const next = new Set(visiting).add(id)
    const match = (rule?: VisibilityRule) => {
      if (!rule) return true
      if (!visible(rule.fieldId, next) || empty(values[rule.fieldId]))
        return false
      const v = values[rule.fieldId]
      const equal = Array.isArray(v)
        ? v.some((item) => item === String(rule.value))
        : v === rule.value
      return rule.op === "not_equals" ? !equal : equal
    }
    return match(section.showIf) && match(field.showIf)
  }
  return fields.filter((f) => visible(f.id, new Set()))
}
/** Hidden/unknown values are cleared in the editor AND excluded from drafts/submissions. */
export function sanitizeValues(
  version: ConfigurableFormVersion,
  values: FormValues,
): FormValues {
  return Object.fromEntries(
    visibleFields(version, values)
      .filter((f) => !["photo", "file", "table"].includes(f.type))
      .filter((f) => values[f.id] !== undefined)
      .map((f) => [
        f.id,
        f.type === "repeatingTable" && isTableRows(values[f.id])
          ? (values[f.id] as import("./types").CareTableRow[]).map((row) => ({
              id: row.id,
              values: Object.fromEntries(
                Object.entries(row.values).filter(([id]) =>
                  f.columns.some(
                    (c) => c.id === id && !["photo", "file"].includes(c.type),
                  ),
                ),
              ),
            }))
          : values[f.id],
      ]),
  )
}
export function initialFormValues(
  version: ConfigurableFormVersion,
  existing?: FormValues,
): FormValues {
  const values: FormValues = existing
    ? structuredClone(existing)
    : Object.fromEntries(
        allFields(version)
          .filter((f) => f.defaultValue !== undefined)
          .map((f) => [f.id, f.defaultValue!]),
      )
  for (const f of allFields(version))
    if (
      f.type === "datetime" &&
      typeof values[f.id] === "string" &&
      String(values[f.id]).endsWith("Z")
    )
      values[f.id] = toNZDateTimeInput(String(values[f.id]))
  return sanitizeValues(version, values)
}
export function normalizeFormValues(
  version: ConfigurableFormVersion,
  values: FormValues,
): FormValues {
  const clean = sanitizeValues(version, values)
  for (const f of allFields(version))
    if (f.type === "datetime" && typeof clean[f.id] === "string")
      clean[f.id] = fromNZDateTimeInput(String(clean[f.id])) || clean[f.id]
  return clean
}
export function validateForm(
  version: ConfigurableFormVersion,
  values: FormValues,
): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const f of visibleFields(version, values)) {
    const v = values[f.id]
    if (["photo", "file", "table"].includes(f.type)) {
      if (f.required)
        errors[f.id] =
          "This required field type is not supported in this preview."
      continue
    }
    if (f.type === "repeatingTable" && empty(v)) {
      if (f.required || (f.minRows ?? 0) > 0)
        errors[f.id] =
          `Add at least ${Math.max(f.required ? 1 : 0, f.minRows ?? 0)} row(s).`
      continue
    }
    if (empty(v)) {
      if (f.required) errors[f.id] = "This field is required."
      continue
    }
    if (f.type === "repeatingTable") {
      const tableErrors = validateTable(f, v)
      Object.assign(errors, tableErrors)
      continue
    }
    switch (f.type) {
      case "number":
      case "scale": {
        if (typeof v !== "number" || !Number.isFinite(v)) {
          errors[f.id] = "Enter a finite number."
          break
        }
        const min = f.min ?? (f.type === "scale" ? 1 : undefined),
          max = f.max ?? (f.type === "scale" ? 5 : undefined)
        if (min !== undefined && v < min)
          errors[f.id] = `Must be at least ${min}.`
        else if (max !== undefined && v > max)
          errors[f.id] = `Must be ${max} or less.`
        else if (
          f.step &&
          Math.abs(
            (v - (min ?? 0)) / f.step - Math.round((v - (min ?? 0)) / f.step),
          ) > 1e-8
        )
          errors[f.id] = `Use increments of ${f.step}.`
        break
      }
      case "select":
      case "radio":
        if (typeof v !== "string" || !f.options.some((o) => o.value === v))
          errors[f.id] = "Choose an available option."
        break
      case "multi":
        if (
          !Array.isArray(v) ||
          new Set<unknown>(v).size !== v.length ||
          v.some((item) => !f.options.some((o) => o.value === item))
        )
          errors[f.id] = "Choose available options."
        break
      case "yesno":
        if (v !== "Yes" && v !== "No") errors[f.id] = "Choose Yes or No."
        break
      case "date":
        if (
          typeof v !== "string" ||
          !/^\d{4}-\d{2}-\d{2}$/.test(v) ||
          !Number.isFinite(Date.parse(`${v}T00:00:00Z`)) ||
          new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) !== v
        )
          errors[f.id] = "Choose a valid date."
        break
      case "time":
        if (typeof v !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(v))
          errors[f.id] = "Choose a valid time."
        break
      case "datetime":
        if (typeof v !== "string" || !fromNZDateTimeInput(v))
          errors[f.id] = "Choose a valid, unambiguous Pacific/Auckland time."
        break
      default:
        if (typeof v !== "string") errors[f.id] = "Enter text."
    }
  }
  return errors
}

/** Typed table rows are distinct from multi-choice arrays and history indexes. */
export function isTableRows(
  value: unknown,
): value is import("./types").CareTableRow[] {
  return (
    Array.isArray(value) &&
    value.every(
      (r) =>
        typeof r === "object" &&
        r !== null &&
        typeof r.id === "string" &&
        typeof r.values === "object" &&
        r.values !== null &&
        !Array.isArray(r.values) &&
        Object.values(r.values).every(
          (v) => typeof v === "string" || typeof v === "number",
        ),
    )
  )
}
function validateTable(
  field: FormFieldDefinition & RepeatingTableDefinition,
  value: FormValue | undefined,
): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!isTableRows(value)) return { [field.id]: "Enter valid table rows." }
  const min = Math.max(field.required ? 1 : 0, field.minRows ?? 0)
  if (value.length < min) errors[field.id] = `Add at least ${min} row(s).`
  if (field.maxRows !== undefined && value.length > field.maxRows)
    errors[field.id] = `Use ${field.maxRows} rows or fewer.`
  const ids = new Set<string>()
  value.forEach((row, i) => {
    if (!row.id.trim() || ids.has(row.id))
      errors[field.id] = "Each row must have a unique ID."
    ids.add(row.id)
    const cellErrors = validateForm(
      {
        version: 1,
        published: true,
        sections: [
          {
            id: "cells",
            title: "Cells",
            fields: field.columns,
          },
        ],
      },
      row.values,
    )
    for (const [column, message] of Object.entries(cellErrors)) {
      errors[`${field.id}.${row.id}.${column}`] =
        `Row ${i + 1}, ${field.columns.find((c) => c.id === column)?.label}: ${message}`
    }
  })
  if (!errors[field.id] && Object.keys(errors).length)
    errors[field.id] = "Check the highlighted table cells."
  return errors
}
