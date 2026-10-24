import type {
  FormFieldDefinition,
  FormSectionDefinition,
  CareTableColumn,
} from "../../forms/types"
export const key = (prefix: string) => `${prefix}_${crypto.randomUUID()}`
export function makeField(
  type: FormFieldDefinition["type"],
): FormFieldDefinition {
  const base = { id: key("field"), label: "New question" }
  switch (type) {
    case "select":
    case "radio":
    case "multi":
      return {
        ...base,
        type,
        options: [{ value: "option_1", label: "Option 1" }],
      }
    case "repeatingTable":
      return {
        ...base,
        type,
        columns: [],
        allowAdd: true,
        allowRemoveDraftRows: true,
      }
    case "photo":
    case "file":
    case "table":
      return { ...base, type, unsupported: true }
    default:
      return { ...base, type }
  }
}
export function changeFieldType(
  field: FormFieldDefinition,
  type: FormFieldDefinition["type"],
): FormFieldDefinition {
  return {
    ...makeField(type),
    id: field.id,
    label: field.label,
    required: field.required,
    help: field.help,
    placeholder: field.placeholder,
    showIf: field.showIf,
  }
}
export function move<T>(list: readonly T[], index: number, delta: number): T[] {
  const next = [...list],
    target = index + delta
  if (target < 0 || target >= list.length) return next
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}
export function duplicateField(
  field: FormFieldDefinition,
): FormFieldDefinition {
  return {
    ...structuredClone(field),
    id: key("field"),
    label: `${field.label} (copy)`,
  }
}
export function newSection(): FormSectionDefinition {
  return { id: key("section"), title: "New section", fields: [] }
}
export function newColumn(): CareTableColumn {
  return { id: key("column"), label: "New column", type: "text" }
}
