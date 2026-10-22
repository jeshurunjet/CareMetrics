import type {
  ConfigurableFormVersion,
  FormValues,
  FormFieldDefinition,
} from "./types"
import { visibleFields, initialFormValues, isTableRows } from "./engine"
import { formatDateTime, formatDateOnly } from "../../lib/time"
export function display(
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
  return Array.isArray(value)
    ? value.filter((v) => typeof v === "string").join(", ")
    : String(value)
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
                <div
                  key={field.id}
                  className={
                    field.type === "repeatingTable" ? "cm-dl-full" : undefined
                  }
                >
                  <dt>{field.label}</dt>
                  <dd className="cm-diary-text">
                    {field.type === "repeatingTable" ? (
                      <div>
                        <p className="cm-hint">
                          Read-only rows. Scroll the table horizontally to see
                          all columns.
                        </p>
                        <div
                          className="cm-table-wrap"
                          role="region"
                          aria-label={`${field.label} submitted rows`}
                          tabIndex={0}
                        >
                          <table className="cm-table">
                            <caption className="sr-only">
                              {field.label} · original version {version.version}
                            </caption>
                            <thead>
                              <tr>
                                <th scope="col">Row</th>
                                {field.columns.map((c) => (
                                  <th scope="col" key={c.id}>
                                    {c.label}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {isTableRows(values[field.id]) &&
                                (values[
                                  field.id
                                ] as import("./types").CareTableRow[]).map(
                                  (row, i) => (
                                    <tr key={row.id}>
                                      <th scope="row">{i + 1}</th>
                                      {field.columns.map((c) => (
                                        <td key={c.id}>
                                          {display(c, row.values[c.id])}
                                        </td>
                                      ))}
                                    </tr>
                                  ),
                                )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      display(field, values[field.id])
                    )}
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
