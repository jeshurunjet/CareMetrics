"use client"
import type {
  CareTableColumn,
  FormFieldDefinition,
  RepeatingTableDefinition,
} from "../../forms/types"
import { Btn } from "../../staff/ui"
import { Field, SelectField } from "../ui/Form"
import { cellTypes } from "./validation"
import { move, newColumn } from "./builder-model"
import OptionsEditor from "./OptionsEditor"
interface NumericLimits {
  min?: number
  max?: number
  step?: number
}
export function NumericSettings({
  value,
  onChange,
}: {
  value: NumericLimits
  onChange: (v: NumericLimits) => void
}) {
  return (
    <div className="ad-numeric-settings">
      {(["min", "max", "step"] as const).map((k) => (
        <Field
          key={k}
          label={k === "min" ? "Minimum" : k === "max" ? "Maximum" : "Step"}
          type="number"
          value={String(value[k] ?? "")}
          onChange={(s) =>
            onChange({ ...value, [k]: s === "" ? undefined : Number(s) })
          }
        />
      ))}
    </div>
  )
}
export default function TableEditor({
  field,
  onChange,
}: {
  field: FormFieldDefinition & RepeatingTableDefinition
  onChange: (field: FormFieldDefinition) => void
}) {
  const columns = (cols: CareTableColumn[]) =>
      onChange({ ...field, columns: cols }),
    patch = (i: number, c: CareTableColumn) =>
      columns(field.columns.map((x, n) => (n === i ? c : x)))
  return (
    <div className="ad-table-config">
      <h4>Repeating table</h4>
      <Field
        label="Minimum rows"
        type="number"
        value={String(field.minRows ?? "")}
        onChange={(v) =>
          onChange({ ...field, minRows: v === "" ? undefined : Number(v) })
        }
      />
      <Field
        label="Maximum rows"
        type="number"
        value={String(field.maxRows ?? "")}
        onChange={(v) =>
          onChange({ ...field, maxRows: v === "" ? undefined : Number(v) })
        }
      />
      <label className="ad-check">
        <input
          type="checkbox"
          checked={field.allowAdd !== false}
          onChange={(e) => onChange({ ...field, allowAdd: e.target.checked })}
        />
        Allow Add Row
      </label>
      <label className="ad-check">
        <input
          type="checkbox"
          checked={field.allowRemoveDraftRows !== false}
          onChange={(e) =>
            onChange({ ...field, allowRemoveDraftRows: e.target.checked })
          }
        />
        Allow Remove Draft Row
      </label>
      {field.columns.map((c, i) => (
        <fieldset key={c.id} className="ad-column-editor">
          <legend>Column {i + 1}</legend>
          <code>{c.id}</code>
          <Field
            label={`Column ${i + 1} label`}
            value={c.label}
            onChange={(label) => patch(i, { ...c, label })}
          />
          <SelectField
            label={`Column ${i + 1} type`}
            value={c.type}
            options={cellTypes.map((t) => ({ value: t, label: t }))}
            onChange={(type) =>
              patch(i, {
                id: c.id,
                label: c.label,
                required: c.required,
                ...(["select", "radio"].includes(type)
                  ? {
                      type: type as "select" | "radio",
                      options: [{ value: "option_1", label: "Option 1" }],
                    }
                  : {
                      type: type as "text" | "number" | "date" | "time" | "yesno",
                    }),
              })
            }
          />
          <label className="ad-check">
            <input
              type="checkbox"
              checked={!!c.required}
              onChange={(e) => patch(i, { ...c, required: e.target.checked })}
            />
            Required column {i + 1}
          </label>
          {c.type === "number" && (
            <NumericSettings
              value={c}
              onChange={(v) => patch(i, { ...c, ...v })}
            />
          )}
          {"options" in c && (
            <OptionsEditor
              options={c.options}
              onChange={(options) => patch(i, { ...c, options })}
            />
          )}
          <div className="ad-inline">
            <Btn
              size="sm"
              variant="ghost"
              disabled={!i}
              onClick={() => columns(move(field.columns, i, -1))}
            >
              Move column {i + 1} up
            </Btn>
            <Btn
              size="sm"
              variant="ghost"
              disabled={i === field.columns.length - 1}
              onClick={() => columns(move(field.columns, i, 1))}
            >
              Move column {i + 1} down
            </Btn>
            <Btn
              size="sm"
              variant="ghost"
              onClick={() =>
                columns(field.columns.filter((x) => x.id !== c.id))
              }
            >
              Remove column {i + 1}
            </Btn>
          </div>
        </fieldset>
      ))}
      <Btn
        size="sm"
        variant="secondary"
        icon="plus"
        onClick={() => columns([...field.columns, newColumn()])}
      >
        Add column
      </Btn>
    </div>
  )
}
