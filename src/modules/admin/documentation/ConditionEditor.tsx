"use client"
import type { VisibilityRule, FormFieldDefinition } from "../../forms/types"
import { Field, SelectField } from "../ui/Form"
export default function ConditionEditor({
  rule,
  fields,
  target,
  onChange,
}: {
  rule?: VisibilityRule
  fields: readonly FormFieldDefinition[]
  target: string
  onChange: (rule?: VisibilityRule) => void
}) {
  const sources = fields.filter(
      (f) =>
        f.id !== target &&
        !["repeatingTable", "file", "photo", "table"].includes(f.type),
    ),
    source = sources.find((f) => f.id === rule?.fieldId)
  const choices =
    source?.type === "yesno"
      ? [
          { value: "Yes", label: "Yes" },
          { value: "No", label: "No" },
        ]
      : source && "options" in source
        ? source.options
        : undefined
  return (
    <div className="ad-condition-editor">
      <h4>Conditional visibility</h4>
      <label className="ad-check">
        <input
          type="checkbox"
          checked={!!rule}
          onChange={(e) =>
            onChange(
              e.target.checked
                ? { fieldId: sources[0]?.id ?? "", op: "equals", value: "" }
                : undefined,
            )
          }
        />
        Show only when a condition matches
      </label>
      {rule && (
        <>
          <SelectField
            label="Condition source"
            value={rule.fieldId}
            options={[
              { value: "", label: "Choose source" },
              ...sources.map((f) => ({ value: f.id, label: f.label })),
            ]}
            onChange={(fieldId) =>
              onChange({ fieldId, op: "equals", value: "" })
            }
          />
          <SelectField
            label="Condition behaviour"
            value={rule.op}
            options={[
              { value: "equals", label: "Show when equal to" },
              {
                value: "not_equals",
                label: "Hide when equal to (show otherwise)",
              },
              ...(source?.type === "multi"
                ? [{ value: "includes", label: "Show when selection includes" }]
                : []),
            ]}
            onChange={(op) =>
              onChange({ ...rule, op: op as VisibilityRule["op"] })
            }
          />
          {choices ? (
            <SelectField
              label="Expected value"
              value={String(rule.value)}
              options={[
                { value: "", label: "Choose value" },
                ...choices.filter(
                  (o, i) => choices.findIndex((x) => x.value === o.value) === i,
                ),
              ]}
              onChange={(value) => onChange({ ...rule, value })}
            />
          ) : (
            <Field
              label="Expected value"
              type={
                source && ["number", "scale"].includes(source.type)
                  ? "number"
                  : "text"
              }
              value={String(rule.value)}
              onChange={(v) =>
                onChange({
                  ...rule,
                  value:
                    source &&
                    ["number", "scale"].includes(source.type) &&
                    v !== ""
                      ? Number(v)
                      : v,
                })
              }
            />
          )}
          <p className="ad-faint">
            Target: {target}. Empty or hidden sources hide this target. Hidden
            answers are cleared. Cycles prevent publication.
          </p>
        </>
      )}
    </div>
  )
}
