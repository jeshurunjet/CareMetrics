import { useId, type ReactElement } from "react"
import { cloneElement } from "react"
import Icon from "@/components/Icon"
export default function FormField({
  label,
  required,
  error,
  help,
  children,
  htmlFor,
}: {
  label: string
  required?: boolean
  error?: string
  help?: string
  children: ReactElement
  htmlFor: string
}) {
  const id = useId()
  return (
    <div className={`cm-field ${error ? "cm-field--error" : ""}`}>
      <label htmlFor={htmlFor}>
        {label}
        {required && <em aria-hidden="true">*</em>}
      </label>
      {help && (
        <small className="cm-help" id={`${id}-help`}>
          {help}
        </small>
      )}
      {cloneElement(children as ReactElement<Record<string, unknown>>, {
        "aria-label": label,
        "aria-required": required,
        "aria-invalid": !!error,
        "aria-describedby":
          [help && `${id}-help`, error && `${id}-error`]
            .filter(Boolean)
            .join(" ") || undefined,
      })}
      {error && (
        <small id={`${id}-error`} className="cm-error" role="alert">
          <Icon name="alert" size={13} />
          {error}
        </small>
      )}
    </div>
  )
}
