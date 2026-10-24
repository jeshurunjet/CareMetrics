"use client"
import type {
  FormFieldDefinition,
  FormSectionDefinition,
  FormValue,
} from "../../forms/types"
import { Btn } from "../../staff/ui"
import { Field, SelectField } from "../ui/Form"
import { fieldTypes } from "./validation"
import { changeFieldType } from "./builder-model"
import OptionsEditor from "./OptionsEditor"
import ConditionEditor from "./ConditionEditor"
import TableEditor, { NumericSettings } from "./TableEditor"
export const typeLabels: Record<FormFieldDefinition["type"], string> = {
  text: "Short Text",
  textarea: "Long Text",
  number: "Number",
  yesno: "Yes/No",
  select: "Dropdown",
  radio: "Radio Buttons",
  multi: "Multiple Choice",
  date: "Date",
  time: "Time",
  datetime: "Date and Time",
  scale: "Scale",
  repeatingTable: "Repeating Editable Table",
  photo: "Photo · unavailable",
  file: "File · unavailable",
  table: "Legacy table · unavailable",
}
export const typeIcons: Record<FormFieldDefinition["type"], string> = {
  text: "edit",
  textarea: "file",
  number: "hash",
  date: "calendar",
  time: "clock",
  datetime: "calendar",
  select: "chevron",
  radio: "check",
  multi: "list",
  yesno: "check",
  scale: "chart",
  repeatingTable: "grid",
  photo: "image",
  file: "upload",
  table: "grid",
}
export default function PropertiesEditor({
  field,
  section,
  fields,
  sections,
  onField,
  onSection,
  moveToSection,
}: {
  field?: FormFieldDefinition
  section?: FormSectionDefinition
  fields: readonly FormFieldDefinition[]
  sections: readonly FormSectionDefinition[]
  onField: (f: FormFieldDefinition) => void
  onSection: (s: FormSectionDefinition) => void
  moveToSection: (id: string) => void
}) {
  if (!section)
    return (
      <aside className="ad-props">
        <p className="ad-empty-inline">
          Select a section or question to edit its properties.
        </p>
      </aside>
    )
  if (!field)
    return (
      <aside className="ad-props">
        <h3>Section properties</h3>
        <code>{section.id}</code>
        <Field
          label="Section title"
          value={section.title}
          onChange={(title) => onSection({ ...section, title })}
        />
        <Field
          label="Section help"
          value={section.help ?? ""}
          onChange={(help) => onSection({ ...section, help })}
        />
        <ConditionEditor
          rule={section.showIf}
          fields={fields}
          target={section.id}
          onChange={(showIf) => onSection({ ...section, showIf })}
        />
      </aside>
    )
  const patch = (v: Partial<FormFieldDefinition>) =>
    onField({ ...field, ...v } as FormFieldDefinition)
  const setDefault = (defaultValue?: FormValue) => patch({ defaultValue })
  return (
    <aside className="ad-props" aria-label="Field properties">
      <h3>Field properties</h3>
      <label>
        Stable internal key<code className="ad-block">{field.id}</code>
      </label>
      <Field
        label="Field label"
        value={field.label}
        onChange={(label) => patch({ label })}
      />
      <SelectField
        label="Field type"
        value={field.type}
        options={[...fieldTypes, "photo", "file" as const].map((t) => ({
          value: t,
          label: typeLabels[(t as FormFieldDefinition["type"])],
        }))}
        onChange={(t) =>
          onField(changeFieldType(field, t as FormFieldDefinition["type"]))
        }
      />
      <Field
        label="Help text"
        value={field.help ?? ""}
        onChange={(help) => patch({ help })}
      />
      <Field
        label="Placeholder"
        value={field.placeholder ?? ""}
        onChange={(placeholder) => patch({ placeholder })}
      />
      <SelectField
        label="Section"
        value={section.id}
        options={sections.map((s) => ({ value: s.id, label: s.title }))}
        onChange={moveToSection}
      />
      <label className="ad-check">
        <input
          type="checkbox"
          checked={!!field.required}
          onChange={(e) => patch({ required: e.target.checked })}
        />
        Required question
      </label>
      {(field.type === "number" || field.type === "scale") && (
        <NumericSettings
          value={field}
          onChange={(v) => onField({ ...field, ...v })}
        />
      )}
      {"options" in field && (
        <OptionsEditor
          options={field.options}
          onChange={(options) => onField({ ...field, options })}
        />
      )}
      {field.type === "multi" ? (
        <div>
          <h4>Default selections</h4>
          {field.options.map((o, i) => (
            <label className="ad-check" key={`${o.value}-${i}`}>
              <input
                type="checkbox"
                checked={
                  Array.isArray(field.defaultValue) &&
                  field.defaultValue.includes(o.value as never)
                }
                onChange={(e) => {
                  const before = Array.isArray(field.defaultValue)
                    ? field.defaultValue.filter(
                        (x): x is string => typeof x === "string",
                      )
                    : []
                  setDefault(
                    e.target.checked
                      ? [...before, o.value]
                      : before.filter((v) => v !== o.value),
                  )
                }}
              />
              {o.label}
            </label>
          ))}
        </div>
      ) : ["select", "radio", "yesno"].includes(field.type) ? (
        <SelectField
          label="Default value"
          value={String(field.defaultValue ?? "")}
          options={[
            { value: "", label: "No default" },
            ...("options" in field
              ? field.options.filter(
                  (o, i, list) =>
                    list.findIndex((x) => x.value === o.value) === i,
                )
              : [
                  { value: "Yes", label: "Yes" },
                  { value: "No", label: "No" },
                ]),
          ]}
          onChange={(v) => setDefault(v || undefined)}
        />
      ) : !["repeatingTable", "photo", "file", "table"].includes(field.type) ? (
        <Field
          label="Default value"
          type={
            ["number", "scale"].includes(field.type)
              ? "number"
              : field.type === "datetime"
                ? "datetime-local"
                : ["date", "time"].includes(field.type)
                  ? field.type
                  : "text"
          }
          value={String(field.defaultValue ?? "")}
          onChange={(v) =>
            setDefault(
              v === ""
                ? undefined
                : ["number", "scale"].includes(field.type)
                  ? Number(v)
                  : v,
            )
          }
        />
      ) : null}
      {field.defaultValue !== undefined && (
        <Btn variant="ghost" size="sm" onClick={() => setDefault(undefined)}>
          Clear default
        </Btn>
      )}
      <ConditionEditor
        rule={field.showIf}
        fields={fields}
        target={field.id}
        onChange={(showIf) => patch({ showIf })}
      />
      {field.type === "repeatingTable" && (
        <TableEditor field={field} onChange={onField} />
      )}
      {["photo", "file", "table"].includes(field.type) && (
        <p className="ad-faint">
          Runtime unavailable. This draft cannot publish until this field is
          removed or changed.
        </p>
      )}
    </aside>
  )
}
