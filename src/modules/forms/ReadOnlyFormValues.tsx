import type {
  ConfigurableFormVersion,
  FormValues,
  FormFieldDefinition,
} from "./types"
import { visibleFields, initialFormValues } from "./engine"
import { formatDateTime, formatDateOnly } from "../../lib/time"
function display(
  field: FormFieldDefinition,
  value: FormValues[string] | undefined,
): string {
  if (
    value === undefined ||
    value === "" ||
    (Array.isArray(value) && !value.length)
  )
    return "—"
  if (field.type === "scale") return `${String(value)} / ${field.max ?? 5}`
  if (
    field.type === "datetime" &&
    typeof value === "string" &&
    value.endsWith("Z") &&
    Number.isFinite(Date.parse(value))
  )
    return formatDateTime(value)
  if (
    field.type === "date" &&
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(`${value}T00:00:00Z`))
  )
    return formatDateOnly(value)
  if (
    field.type === "select" ||
    field.type === "radio" ||
    field.type === "multi"
  )
    return (Array.isArray(value) ? value : [String(value)])
      .map((v) => field.options.find((o) => o.value === v)?.label ?? v)
      .join(", ")
  return Array.isArray(value) ? value.join(", ") : String(value)
}
export default function ReadOnlyFormValues({
  version,
  values,
}: {
  version: ConfigurableFormVersion
  values: FormValues
}) {
  const visible = new Set(
    visibleFields(version, initialFormValues(version, values)).map((f) => f.id),
  )
  return (
    <div className="cm-stack">
      {version.sections.map((section) => {
        const fields = section.fields.filter(
          (f) =>
            visible.has(f.id) && !["photo", "file", "table"].includes(f.type),
        )
        return fields.length ? (
          <section key={section.id}>
            <h3 className="cm-h3">{section.title}</h3>
            <dl className="cm-dl">
              {fields.map((field) => (
                <div key={field.id}>
                  <dt>{field.label}</dt>
                  <dd className="cm-diary-text">
                    {display(field, values[field.id])}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null
      })}
    </div>
  )
}
