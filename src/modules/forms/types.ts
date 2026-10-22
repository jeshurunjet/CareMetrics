/** Declarative data only. No template-supplied code or expressions are executed. */
export type CellValue = string | number
export interface CareTableRow {
  id: string
  values: Record<string, CellValue>
}
export type FormValue = string | number | string[] | CareTableRow[]
export type FormValues = Record<string, FormValue>
export interface VisibilityRule {
  fieldId: string
  op: "equals" | "not_equals" | "includes"
  value: string | number
}
interface BaseField {
  id: string
  label: string
  required?: boolean
  help?: string
  placeholder?: string
  defaultValue?: FormValue
  showIf?: VisibilityRule
}
export interface FormOption {
  value: string
  label: string
}
interface ColumnBase {
  id: string
  label: string
  required?: boolean
  help?: string
}
type ColumnKind = { type: "text" | "date" | "time" | "yesno" } | {
  type: "number"
  min?: number
  max?: number
  step?: number
} | {
  type: "select" | "radio"
  options: readonly FormOption[]
} | {
  type: "photo" | "file"
  unsupported: true
}
export type CareTableColumn = ColumnBase & ColumnKind
export interface RepeatingTableDefinition {
  type: "repeatingTable"
  columns: readonly CareTableColumn[]
  minRows?: number
  maxRows?: number
  allowAdd?: boolean
}
type FieldKind = {
  type: "text" | "textarea" | "date" | "time" | "datetime"
} | {
  type: "number" | "scale"
  min?: number
  max?: number
  step?: number
} | { type: "yesno" } | {
  type: "select" | "radio" | "multi"
  options: readonly FormOption[]
} | {
  type: "photo" | "file" | "table"
  unsupported: true
}
type SupportedFieldKind = FieldKind | RepeatingTableDefinition
export type FormFieldDefinition = BaseField & SupportedFieldKind
export interface FormSectionDefinition {
  id: string
  title: string
  help?: string
  showIf?: VisibilityRule
  fields: readonly FormFieldDefinition[]
}
export interface ConfigurableFormVersion {
  reference?: {
    label: string
    items: readonly FormOption[]
  }
  version: number
  published: boolean
  sections: readonly FormSectionDefinition[]
}
