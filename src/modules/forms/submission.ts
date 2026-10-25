/** Strict JSON boundaries around the established renderer/validation engine. */
import {
  validateTemplate,
  validKey,
  fieldTypes,
  cellTypes,
} from "../admin/documentation/validation"
import {
  allFields,
  visibleFields,
  validateForm,
  normalizeFormValues,
} from "./engine"
import { toNZDateTimeInput } from "../../lib/time"
import type {
  ConfigurableFormVersion,
  FormFieldDefinition,
  FormValues,
} from "./types"

export class FormContractError extends Error {
  constructor(public fields: Record<string, string>) {
    super("Check the highlighted answers.")
  }
}
function record(v: unknown): v is Record<string, unknown> {
  return (
    !!v &&
    typeof v === "object" &&
    !Array.isArray(v) &&
    [Object.prototype, null].includes(Object.getPrototypeOf(v))
  )
}
function shape(
  v: unknown,
  keys: readonly string[],
): asserts v is Record<string, unknown> {
  if (!record(v) || Object.keys(v).some((k) => !keys.includes(k)))
    throw new Error("Invalid definition shape")
}
function boundedText(v: unknown, max: number): v is string {
  return (
    typeof v === "string" &&
    v.length <= max &&
    !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v)
  )
}
function length(value: unknown, max: number) {
  if (new TextEncoder().encode(JSON.stringify(value)).byteLength > max)
    throw new Error("Data exceeds supported size")
}
function condition(v: unknown) {
  if (v === undefined) return
  shape(v, ["fieldId", "op", "value"])
  if (
    !validKey(v.fieldId as string) ||
    !["equals", "not_equals", "includes"].includes(v.op as string) ||
    !(
      boundedText(v.value, 1000) ||
      (typeof v.value === "number" && Number.isFinite(v.value))
    )
  )
    throw new Error("Invalid visibility rule")
}
function options(v: unknown) {
  if (!Array.isArray(v) || !v.length || v.length > 100)
    throw new Error("Invalid options")
  for (const o of v) {
    shape(o, ["value", "label"])
    if (!boundedText(o.value, 1000) || !boundedText(o.label, 1000))
      throw new Error("Invalid option")
  }
}
function field(v: unknown, column = false) {
  shape(
    v,
    column
      ? [
          "id",
          "type",
          "label",
          "help",
          "required",
          "min",
          "max",
          "step",
          "options",
        ]
      : [
          "id",
          "type",
          "label",
          "help",
          "required",
          "placeholder",
          "defaultValue",
          "showIf",
          "min",
          "max",
          "step",
          "options",
          "columns",
          "minRows",
          "maxRows",
          "allowAdd",
          "allowRemoveDraftRows",
        ],
  )
  if (
    !validKey(v.id as string) ||
    !boundedText(v.label, 500) ||
    !(column ? cellTypes : fieldTypes).some((t) => t === v.type)
  )
    throw new Error("Unsupported field")
  for (const k of ["help", "placeholder"])
    if (v[k] !== undefined && !boundedText(v[k], 4000))
      throw new Error("Invalid field text")
  for (const k of ["required", "allowAdd", "allowRemoveDraftRows"])
    if (v[k] !== undefined && typeof v[k] !== "boolean")
      throw new Error("Invalid boolean setting")
  for (const k of ["min", "max", "step"])
    if (
      v[k] !== undefined &&
      (typeof v[k] !== "number" || !Number.isFinite(v[k]))
    )
      throw new Error("Invalid numeric setting")
  if (
    v.options !== undefined &&
    !["select", "radio", "multi"].includes(v.type as string)
  )
    throw new Error("Options require a choice field")
  if (
    ["min", "max", "step"].some((k) => v[k] !== undefined) &&
    !["number", "scale"].includes(v.type as string)
  )
    throw new Error("Numeric settings require a numeric field")
  if (
    ["columns", "minRows", "maxRows", "allowAdd", "allowRemoveDraftRows"].some(
      (k) => v[k] !== undefined,
    ) &&
    v.type !== "repeatingTable"
  )
    throw new Error("Row settings require a repeating table")
  condition(v.showIf)
  if (["select", "radio", "multi"].includes(v.type as string))
    options(v.options)
  if (v.type === "repeatingTable") {
    if (!Array.isArray(v.columns) || !v.columns.length || v.columns.length > 40)
      throw new Error("Invalid table columns")
    for (const c of v.columns) field(c, true)
    for (const k of ["minRows", "maxRows"])
      if (
        v[k] !== undefined &&
        (!Number.isInteger(v[k]) || Number(v[k]) < 0 || Number(v[k]) > 100)
      )
        throw new Error("Unsupported row bound")
  }
}
/** A malformed/unsupported published definition is an integrity failure, never silently edited. */
export function publishedDefinition(
  raw: unknown,
  version: number,
  name: string,
): ConfigurableFormVersion {
  length(raw, 131072)
  shape(raw, [
    "version",
    "published",
    "sections",
    "name",
    "description",
    "publishedAt",
    "publishedBy",
    "summary",
    "history",
    "reference",
  ])
  if (
    raw.published !== true ||
    raw.version !== version ||
    !Number.isInteger(version) ||
    version < 1 ||
    !Array.isArray(raw.sections) ||
    !raw.sections.length ||
    raw.sections.length > 50
  )
    throw new Error("Unavailable published definition")
  for (const k of [
    "name",
    "description",
    "publishedAt",
    "publishedBy",
    "summary",
  ])
    if (raw[k] !== undefined && !boundedText(raw[k], k === "name" ? 160 : 4000))
      throw new Error("Invalid metadata")
  let count = 0
  for (const s of raw.sections) {
    shape(s, ["id", "title", "help", "showIf", "fields"])
    if (
      !validKey(s.id as string) ||
      !boundedText(s.title, 500) ||
      (s.help !== undefined && !boundedText(s.help, 4000)) ||
      !Array.isArray(s.fields) ||
      !s.fields.length ||
      (count += s.fields.length) > 200
    )
      throw new Error("Invalid section")
    condition(s.showIf)
    for (const f of s.fields) field(f)
  }
  if (raw.history !== undefined) {
    shape(raw.history, ["columns", "chart"])
    if (
      !Array.isArray(raw.history.columns) ||
      raw.history.columns.length > 200 ||
      raw.history.columns.some((id) => !validKey(id))
    )
      throw new Error("Invalid history metadata")
    if (raw.history.chart !== undefined) {
      shape(raw.history.chart, ["fieldId", "unit"])
      if (
        !validKey(raw.history.chart.fieldId as string) ||
        !boundedText(raw.history.chart.unit, 100)
      )
        throw new Error("Invalid chart metadata")
    }
  }
  if (raw.reference !== undefined) {
    shape(raw.reference, ["label", "items"])
    if (!boundedText(raw.reference.label, 500))
      throw new Error("Invalid reference")
    options(raw.reference.items)
  }
  const form = raw as unknown as ConfigurableFormVersion
  const issues = validateTemplate({
    name: form.name ?? name,
    description: form.description ?? "",
    summary: form.summary ?? "",
    history: form.history,
    form: { ...form, published: false },
  })
  if (issues.length) throw new Error("Invalid published form contract")
  // Defaults use exactly the same value shape rules; they never fill missing submitted answers on the server.
  for (const f of allFields(form))
    if (f.defaultValue !== undefined) valueShape(f, f.defaultValue)
  return structuredClone(form)
}
function fail(id: string, message: string): never {
  throw new FormContractError({ [id]: message })
}
function scalar(value: unknown) {
  return (
    boundedText(value, 10000) ||
    (typeof value === "number" && Number.isFinite(value))
  )
}
function valueShape(f: FormFieldDefinition, value: unknown) {
  if (f.type !== "repeatingTable") {
    if (f.type === "multi") {
      if (
        !Array.isArray(value) ||
        value.length > 100 ||
        value.some((v) => !boundedText(v, 1000))
      )
        fail(f.id, "Choose valid options.")
    } else if (!scalar(value))
      fail(f.id, "Enter a supported value within the text limit.")
    return
  }
  if (!Array.isArray(value) || value.length > 100)
    fail(f.id, "Use at most 100 valid rows.")
  const seen = new Set<string>()
  for (const row of value) {
    if (
      !record(row) ||
      Object.keys(row).some((k) => !["id", "values"].includes(k)) ||
      !validKey(row.id as string) ||
      seen.has(row.id as string) ||
      !record(row.values)
    )
      fail(f.id, "Each row needs a unique stable ID and valid cells.")
    seen.add(row.id as string)
    for (const [key, cell] of Object.entries(row.values))
      if (!f.columns.some((c) => c.id === key) || !scalar(cell))
        fail(f.id, "Unknown column or unsupported cell value.")
  }
}
/** Validate before normalising, so unknown/hidden/unsupported answers cannot disappear silently. */
export function submittedAnswers(
  form: ConfigurableFormVersion,
  raw: unknown,
): FormValues {
  try {
    length(raw, 24576)
  } catch {
    fail("values", "The answer payload exceeds the supported size.")
  }
  if (!record(raw)) fail("values", "Enter a valid answer object.")
  const fields = allFields(form),
    visible = new Set(visibleFields(form, raw as FormValues).map((f) => f.id))
  for (const [key, value] of Object.entries(raw)) {
    const f = fields.find((f) => f.id === key)
    if (!f) fail("values", "Unexpected answer field.")
    if (!visible.has(key))
      fail(key, "Hidden questions cannot contain submitted answers.")
    valueShape(f, value)
  }
  for (const f of fields)
    if (visible.has(f.id) && f.type === "repeatingTable") {
      const rows = Array.isArray(raw[f.id])
          ? raw[f.id] as import("./types").CareTableRow[]
          : [],
        defaults = Array.isArray(f.defaultValue)
          ? f.defaultValue as import("./types").CareTableRow[]
          : []
      if (
        f.allowAdd === false &&
        rows.some((r) => !defaults.some((d) => d.id === r.id))
      )
        fail(f.id, "Additional rows are not permitted by this version.")
      if (
        f.allowRemoveDraftRows === false &&
        defaults.some((d) => !rows.some((r) => r.id === d.id))
      )
        fail(f.id, "Configured rows must be retained.")
    }
  const values = raw as FormValues,
    errors = validateForm(form, values)
  if (Object.keys(errors).length) throw new FormContractError(errors)
  return normalizeFormValues(form, values)
}
export function storedAnswers(
  form: ConfigurableFormVersion,
  raw: unknown,
): FormValues {
  if (!record(raw)) throw new Error("Invalid stored answers")
  const local = structuredClone(raw)
  for (const f of allFields(form))
    if (
      f.type === "datetime" &&
      typeof local[f.id] === "string" &&
      String(local[f.id]).endsWith("Z")
    )
      local[f.id] = toNZDateTimeInput(String(local[f.id]))
  submittedAnswers(form, local)
  return structuredClone(raw) as FormValues
}
export function canonicalJson(value: unknown): string {
  return JSON.stringify(value, (_key, v) =>
    record(v)
      ? Object.fromEntries(
          Object.keys(v)
            .sort()
            .map((k) => [k, v[k]]),
        )
      : v,
  )
}
