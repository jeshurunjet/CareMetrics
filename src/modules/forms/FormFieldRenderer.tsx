"use client"
import type { ReactElement } from "react"
import type { FormFieldDefinition, FormValue } from "./types"
import FormField from "../staff/ui/FormField"
import RepeatingTableField from "./RepeatingTableField"
import ChoiceField from "./ChoiceField"
import Icon from "@/components/Icon"
export default function FormFieldRenderer({
  field,
  value,
  onChange,
  error,
  errors,
}: {
  field: FormFieldDefinition
  value: FormValue | undefined
  onChange: (value: FormValue) => void
  errors?: Record<string, string>
  error?: string
}) {
  const id = `f-${field.id}`,
    f = field
  let control: ReactElement
  switch (f.type) {
    case "yesno":
    case "radio":
    case "multi":
    case "scale": {
      const options =
        f.type === "yesno"
          ? [
              { value: "Yes", label: "Yes" },
              { value: "No", label: "No" },
            ]
          : f.type === "scale"
            ? Array.from(
                {
                  length:
                    Math.floor(((f.max ?? 5) - (f.min ?? 1)) / (f.step ?? 1)) +
                    1,
                },
                (_, i) => ({
                  value: String((f.min ?? 1) + i * (f.step ?? 1)),
                  label: String((f.min ?? 1) + i * (f.step ?? 1)),
                }),
              )
            : "options" in f
              ? f.options
              : []
      control = (
        <ChoiceField
          id={id}
          label={f.label}
          value={value}
          options={options}
          onChange={onChange}
          multiple={f.type === "multi"}
          scale={f.type === "scale"}
          required={f.required}
          error={!!error}
        />
      )
      break
    }
    case "textarea":
      control = (
        <textarea
          id={id}
          className="cm-input"
          rows={4}
          placeholder={f.placeholder}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      )
      break
    case "select":
      control = (
        <select
          id={id}
          className="cm-input"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select…</option>
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )
      break
    case "number":
      control = (
        <input
          id={id}
          className="cm-input"
          type="number"
          inputMode="decimal"
          min={f.min}
          max={f.max}
          step={f.step ?? "any"}
          value={
            typeof value === "number" && Number.isNaN(value)
              ? ""
              : String(value ?? "")
          }
          onChange={(e) =>
            onChange(e.target.value === "" ? "" : Number(e.target.value))
          }
        />
      )
      break
    case "repeatingTable":
      control = (
        <RepeatingTableField
          field={f}
          value={value}
          onChange={onChange}
          errors={errors}
        />
      )
      break
    case "photo":
    case "file":
    case "table":
      control = (
        <div
          id={id}
          className={f.type === "table" ? "cm-repeat" : "cm-file-input"}
          aria-label={f.label}
        >
          <Icon name={f.type === "photo" ? "image" : "upload"} size={18} />
          <span>
            {f.type === "table"
              ? "Repeating table"
              : f.type === "photo"
                ? "Take or choose a photo"
                : "Choose a file"}{" "}
            · unavailable in this phase
          </span>
        </div>
      )
      break
    default:
      control = (
        <input
          id={id}
          className="cm-input"
          type={
            f.type === "datetime"
              ? "datetime-local"
              : f.type === "date" || f.type === "time"
                ? f.type
                : "text"
          }
          placeholder={f.placeholder}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      )
  }
  return (
    <FormField
      label={f.label}
      required={f.required}
      help={
        f.type === "datetime" && !f.help?.includes("Pacific/Auckland")
          ? `${f.help ?? ""} Pacific/Auckland.`
          : f.help
      }
      error={error}
      htmlFor={id}
    >
      {control}
    </FormField>
  )
}
