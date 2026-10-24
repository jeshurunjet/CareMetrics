import type { TemplateDraft } from "../../staff/care/types"
import type {
  CareTableColumn,
  FormFieldDefinition,
  FormOption,
  VisibilityRule,
} from "../../forms/types"
import { allFields, validateForm } from "../../forms/engine"
export const fieldTypes = [
  "text",
  "textarea",
  "number",
  "yesno",
  "select",
  "radio",
  "multi",
  "date",
  "time",
  "datetime",
  "scale",
  "repeatingTable",
] as const
export const cellTypes = [
  "text",
  "number",
  "date",
  "time",
  "yesno",
  "select",
  "radio",
] as const
export interface TemplateIssue {
  target: string
  message: string
}
export const validKey = (id: string) =>
  typeof id === "string" &&
  /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(id) &&
  !["__proto__", "constructor", "prototype"].includes(id)
/** Structural boundary for incomplete session drafts; publication adds semantic validation. */
export function assertDraftShape(d: TemplateDraft) {
  if (
    !d ||
    typeof d.name !== "string" ||
    typeof d.description !== "string" ||
    typeof d.summary !== "string" ||
    !d.form ||
    !Number.isInteger(d.form.version) ||
    d.form.published !== false ||
    !Array.isArray(d.form.sections) ||
    d.form.sections.length > 100
  )
    throw new Error("Invalid draft structure.")
  const sections = new Set<string>(),
    fields = new Set<string>()
  for (const s of d.form.sections) {
    if (
      !s ||
      !validKey(s.id) ||
      sections.has(s.id) ||
      fields.has(s.id) ||
      typeof s.title !== "string" ||
      !Array.isArray(s.fields)
    )
      throw new Error("Sections require unique stable IDs and fields.")
    sections.add(s.id)
    if (s.fields.length > 500) throw new Error("Limit a section to 500 fields.")
    for (const f of s.fields) {
      if (
        !f ||
        !validKey(f.id) ||
        fields.has(f.id) ||
        sections.has(f.id) ||
        typeof f.label !== "string" ||
        ![...fieldTypes, "photo", "file", "table"].includes(f.type)
      )
        throw new Error(
          "Fields require unique stable IDs and supported configuration.",
        )
      fields.add(f.id)
      if (
        [f.help, f.placeholder].some(
          (v) => v !== undefined && typeof v !== "string",
        ) ||
        (f.required !== undefined && typeof f.required !== "boolean")
      )
        throw new Error("Invalid field properties.")
      if (["select", "radio", "multi"].includes(f.type) && !("options" in f))
        throw new Error("Selectable fields require option definitions.")
      if (
        f.type === "repeatingTable" &&
        Array.isArray(f.columns) &&
        f.columns.some(
          (c: CareTableColumn) =>
            ["select", "radio"].includes(c.type) && !("options" in c),
        )
      )
        throw new Error("Selectable columns require options.")
      if (
        "options" in f &&
        (!Array.isArray(f.options) ||
          f.options.some(
            (o: FormOption) =>
              !o || typeof o.label !== "string" || typeof o.value !== "string",
          ))
      )
        throw new Error("Invalid option structure.")
      if (
        f.type === "repeatingTable" &&
        (!Array.isArray(f.columns) ||
          f.columns.some(
            (c: CareTableColumn) =>
              !c ||
              typeof c.id !== "string" ||
              typeof c.label !== "string" ||
              ![...cellTypes, "photo", "file"].includes(c.type) ||
              ("options" in c &&
                (!Array.isArray(c.options) ||
                  c.options.some(
                    (o: FormOption) =>
                      !o ||
                      typeof o.label !== "string" ||
                      typeof o.value !== "string",
                  ))),
          ))
      )
        throw new Error("Invalid column structure.")
    }
  }
}
export function validateTemplate(d: TemplateDraft): TemplateIssue[] {
  const issues: TemplateIssue[] = [],
    add = (target: string, message: string) => issues.push({ target, message })
  try {
    assertDraftShape(d)
  } catch (e) {
    return [{ target: "template", message: (e as Error).message }]
  }
  if (!d.name.trim() || d.name.length > 160)
    add("template", "Enter a template name (up to 160 characters).")
  if (d.description.length > 4000 || d.summary.length > 2000)
    add("template", "Description or version summary is too long.")
  if (!d.form.sections.length)
    add("template", "Add at least one section and field.")
  const fields = allFields(d.form),
    edges = new Map<string, string[]>()
  const options = (target: string, list: readonly FormOption[]) => {
    if (!list?.length) {
      add(target, "Add at least one option.")
      return
    }
    const seen = new Set<string>()
    for (const o of list) {
      if (!o.value.trim() || !o.label.trim() || seen.has(o.value))
        add(target, "Options need nonblank labels and unique stable values.")
      seen.add(o.value)
    }
  }
  const bounds = (
    target: string,
    f: {
      min?: number
      max?: number
      step?: number
    },
    scale = false,
  ) => {
    if (
      [f.min, f.max, f.step].some(
        (v) => v !== undefined && !Number.isFinite(v),
      ) ||
      (f.step !== undefined && f.step <= 0) ||
      (f.min ?? (scale ? 1 : -Infinity)) > (f.max ?? (scale ? 5 : Infinity))
    )
      add(target, "Use finite ordered numeric bounds and a positive step.")
    if (
      scale &&
      [f.min ?? 1, f.max ?? 5, f.step ?? 1].some((v) => !Number.isInteger(v))
    )
      add(target, "Scale bounds and step must be integers.")
    if (scale && ((f.max ?? 5) - (f.min ?? 1)) / (f.step ?? 1) > 100)
      add(target, "Limit a scale to 101 choices.")
  }
  const condition = (target: string, rule?: VisibilityRule) => {
    if (!rule) return
    const source = fields.find((f) => f.id === rule.fieldId)
    if (
      !source ||
      !["equals", "not_equals", "includes"].includes(rule.op) ||
      !["string", "number"].includes(typeof rule.value)
    ) {
      add(
        target,
        "Condition requires an existing source and supported operator/value.",
      )
      return
    }
    if (
      ["repeatingTable", "photo", "file", "table"].includes(source.type) ||
      (rule.op === "includes" && source.type !== "multi")
    )
      add(target, "This source/operator is unsupported for visibility.")
    const candidate = {
      ...source,
      required: false,
      showIf: undefined,
    } as FormFieldDefinition
    const value = source.type === "multi" ? [String(rule.value)] : rule.value
    if (
      Object.keys(
        validateForm(
          {
            version: 1,
            published: false,
            sections: [{ id: "test", title: "Test", fields: [candidate] }],
          },
          { [source.id]: value },
        ),
      ).length ||
      rule.value === ""
    )
      add(target, "Condition value must be valid for its source field.")
  }
  for (const s of d.form.sections) {
    if (!s.title.trim()) add(s.id, "Enter a section title.")
    if (!s.fields.length) add(s.id, "Add a field or remove this empty section.")
    condition(s.id, s.showIf)
    for (const f of s.fields) {
      if (!f.label.trim()) add(f.id, "Enter a field label.")
      if (!fieldTypes.some((t) => t === f.type))
        add(
          f.id,
          "Photo, file and legacy table runtime capabilities are unavailable. Remove this field before publishing.",
        )
      if ("options" in f) options(f.id, f.options)
      if (f.type === "number" || f.type === "scale")
        bounds(f.id, f, f.type === "scale")
      condition(f.id, f.showIf)
      edges.set(
        f.id,
        [s.showIf?.fieldId, f.showIf?.fieldId].filter(
          (id): id is string => !!id,
        ),
      )
      if (f.defaultValue !== undefined) {
        const single = {
          version: 1,
          published: false,
          sections: [
            {
              id: s.id,
              title: s.title,
              fields: [{ ...f, required: false, showIf: undefined }],
            },
          ],
        }
        const errors = validateForm(single, { [f.id]: f.defaultValue })
        if (Object.keys(errors).length)
          add(f.id, `Invalid default: ${Object.values(errors).join(" ")}`)
      }
      if (f.type === "repeatingTable") {
        if (!f.columns.length) add(f.id, "Add at least one table column.")
        const ids = new Set<string>()
        for (const c of f.columns) {
          if (!validKey(c.id) || ids.has(c.id) || !c.label.trim())
            add(f.id, "Table columns need unique stable IDs and labels.")
          ids.add(c.id)
          if (!cellTypes.some((t) => t === c.type))
            add(f.id, "Unsupported table cell type.")
          if ("options" in c) options(f.id, c.options)
          if (c.type === "number") bounds(f.id, c)
        }
        if (
          [f.minRows, f.maxRows].some(
            (v) => v !== undefined && (!Number.isInteger(v) || v < 0),
          ) ||
          Math.max(f.minRows ?? 0, f.required ? 1 : 0) > (f.maxRows ?? Infinity)
        )
          add(
            f.id,
            "Use nonnegative integer row limits with minimum no greater than maximum.",
          )
        if (
          f.allowAdd === false &&
          Math.max(f.minRows ?? 0, f.required ? 1 : 0) >
            (Array.isArray(f.defaultValue) ? f.defaultValue.length : 0)
        )
          add(
            f.id,
            "Required rows cannot be supplied when Add Row is disabled without sufficient default rows.",
          )
      }
    }
  }
  for (const id of edges.keys()) {
    const visit = (node: string, path: Set<string>): boolean =>
      path.has(node) ||
      (edges.get(node) ?? []).some((next) =>
        visit(next, new Set(path).add(node)),
      )
    if (visit(id, new Set()))
      add(id, "Circular visibility dependency (including section conditions).")
  }
  if (d.history) {
    if (
      new Set(d.history.columns).size !== d.history.columns.length ||
      d.history.columns.some((id) => !fields.some((f) => f.id === id))
    )
      add(
        "template",
        "History columns must reference distinct existing fields.",
      )
    const chart = d.history.chart
    if (
      chart &&
      (!chart.unit.trim() ||
        !fields.some(
          (f) => f.id === chart.fieldId && ["number", "scale"].includes(f.type),
        ))
    )
      add(
        "template",
        "A simple chart needs a numeric field and an explicit unit.",
      )
  }
  return issues
}
