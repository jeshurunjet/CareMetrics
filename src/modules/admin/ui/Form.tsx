"use client"
import { useId, type ReactNode } from "react"
import FormField from "@/modules/staff/ui/FormField"
import useUnsavedChanges from "@/modules/staff/diary/use-unsaved-changes"
import type { Errors } from "../data/types"
export function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  error,
  help,
  disabled = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
  error?: string
  help?: string
  disabled?: boolean
}) {
  const id = useId()
  return (
    <FormField
      label={label}
      htmlFor={id}
      required={required}
      error={error}
      help={help}
    >
      {type === "textarea" ? (
        <textarea
          id={id}
          className="cm-input"
          rows={3}
          maxLength={4000}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          id={id}
          className="cm-input"
          type={type}
          value={value}
          disabled={disabled}
          maxLength={type === "email" ? 254 : 4000}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </FormField>
  )
}
export function SelectField({
  label,
  value,
  onChange,
  options,
  disabled = false,
  error,
  help,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: FormOption[]
  disabled?: boolean
  error?: string
  help?: string
}) {
  const id = useId()
  return (
    <FormField label={label} htmlFor={id} error={error} help={help}>
      <select
        id={id}
        className="cm-input"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
    </FormField>
  )
}
export function FormErrors({ errors }: { errors: Errors }) {
  return Object.keys(errors).length ? (
    <div className="cm-banner cm-banner--danger" role="alert">
      <div>
        <strong>Changes not saved</strong>
        {Object.entries(errors).map(([key, error]) => (
          <p key={key}>{error}</p>
        ))}
      </div>
    </div>
  ) : null
}
export function useAdminFormGuard(dirty: boolean) {
  useUnsavedChanges(dirty)
  return () =>
    !dirty ||
    window.confirm(
      "Discard unsaved changes? Your development edits will be lost.",
    )
}
export default function AdminForm({
  children,
  onSubmit,
}: {
  children: ReactNode
  onSubmit: () => void
}) {
  return (
    <form
      className="ad-entity-form"
      data-diary-editor
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
    >
      {children}
    </form>
  )
}

interface FormOption {
  value: string
  label: string
  disabled?: boolean
}
