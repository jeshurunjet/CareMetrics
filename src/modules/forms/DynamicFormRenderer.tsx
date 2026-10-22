"use client"
import type { ConfigurableFormVersion, FormValues } from "./types"
import { sanitizeValues, visibleFields } from "./engine"
import FormFieldRenderer from "./FormFieldRenderer"
export default function DynamicFormRenderer({
  version,
  values,
  onChange,
  errors = {},
}: {
  version: ConfigurableFormVersion
  values: FormValues
  onChange: (values: FormValues) => void
  errors?: Record<string, string>
}) {
  const visible = new Set(visibleFields(version, values).map((f) => f.id))
  return (
    <div className="cm-form" aria-label="Assessment questions">
      {version.reference && (
        <div
          className="cm-bristol"
          role="group"
          aria-label={version.reference.label}
        >
          {version.reference.items.map((o) => (
            <span key={o.value}>
              <b>{o.value}</b>
              {o.label}
            </span>
          ))}
        </div>
      )}
      {version.sections.map((section) => {
        const fields = section.fields.filter((f) => visible.has(f.id))
        if (!fields.length) return null
        return (
          <section
            key={section.id}
            aria-labelledby={`section-${section.id}`}
            className="cm-assessment-section"
          >
            <h3 className="cm-form-section" id={`section-${section.id}`}>
              {section.title}
            </h3>
            {section.help && <p className="cm-help">{section.help}</p>}
            {fields.map((field) => (
              <div className="cm-form-item" key={field.id}>
                <FormFieldRenderer
                  field={field}
                  value={values[field.id]}
                  onChange={(value) =>
                    onChange(
                      sanitizeValues(version, { ...values, [field.id]: value }),
                    )
                  }
                  error={errors[field.id]}
                  errors={errors}
                />
              </div>
            ))}
          </section>
        )
      })}
    </div>
  )
}
