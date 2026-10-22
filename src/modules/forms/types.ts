/** Declarative data only. No template-supplied code or expressions are executed. */
export type FormValue = string | number | string[]
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
export type FormFieldDefinition = BaseField & FieldKind
export interface FormSectionDefinition {
  id: string
  title: string
  help?: string
  showIf?: VisibilityRule
  fields: readonly FormFieldDefinition[]
}
export interface ConfigurableFormVersion {
  version: number
  published: boolean
  sections: readonly FormSectionDefinition[]
}
