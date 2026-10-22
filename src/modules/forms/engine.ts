import type {
  ConfigurableFormVersion,
  FormValues,
  FormValue,
  VisibilityRule,
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
        ? v.includes(String(rule.value))
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
      .map((f) => [f.id, values[f.id]]),
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
    if (empty(v)) {
      if (f.required) errors[f.id] = "This field is required."
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
          new Set(v).size !== v.length ||
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
