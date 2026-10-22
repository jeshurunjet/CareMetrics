"use client"
import { useRef } from "react"
import type {
  FormFieldDefinition,
  RepeatingTableDefinition,
  CareTableRow,
} from "./types"
import { isTableRows } from "./engine"
import FormFieldRenderer from "./FormFieldRenderer"
import { Btn, Icon } from "../staff/ui"
export default function RepeatingTableField({
  field,
  value,
  onChange,
  errors = {},
  ...aria
}: {
  field: FormFieldDefinition & RepeatingTableDefinition
  value: unknown
  onChange: (rows: CareTableRow[]) => void
  errors?: Record<string, string>
  "aria-describedby"?: string
}) {
  const ref = useRef<HTMLDivElement>(null),
    rows = isTableRows(value) ? value : []
  const focusRow = (id?: string) =>
    queueMicrotask(() => {
      const row = Array.from(
        ref.current?.querySelectorAll<HTMLElement>("[data-table-row]") ?? [],
      ).find((el) => el.dataset.tableRow === id)
      ;(
        row?.querySelector<HTMLElement>("input,select,button") ??
        ref.current?.querySelector<HTMLElement>("[data-add-row]")
      )?.focus()
    })
  const max = field.maxRows !== undefined && rows.length >= field.maxRows
  return (
    <div
      id={`f-${field.id}`}
      ref={ref}
      className="cm-repeat cm-configured-table"
      role="group"
      aria-label={field.label}
      aria-describedby={aria["aria-describedby"]}
    >
      {!rows.length && (
        <p className="cm-muted cm-repeat-empty">
          No rows added yet. Select Add Row to begin.
        </p>
      )}
      {rows.map((row, i) => (
        <div className="cm-repeat-row" key={row.id} data-table-row={row.id}>
          <strong className="cm-table-row-heading">Row {i + 1}</strong>
          {field.columns.map((column) => (
            <div key={column.id} className="cm-repeat-cell">
              <FormFieldRenderer
                field={{
                  ...column,
                  id: `${field.id}-${row.id}-${column.id}`,
                  label: `${column.label} · Row ${i + 1}`,
                }}
                value={row.values[column.id]}
                error={errors[`${field.id}.${row.id}.${column.id}`]}
                onChange={(cell) => {
                  if (typeof cell !== "string" && typeof cell !== "number")
                    return
                  onChange(
                    rows.map((r) =>
                      r.id === row.id
                        ? { ...r, values: { ...r.values, [column.id]: cell } }
                        : r,
                    ),
                  )
                }}
              />
            </div>
          ))}
          <button
            type="button"
            className="cm-repeat-remove"
            aria-label={`Remove draft row ${i + 1}`}
            onClick={() => {
              const next = rows.filter((r) => r.id !== row.id)
              onChange(next)
              focusRow(next[Math.min(i, next.length - 1)]?.id)
            }}
          >
            <Icon name="x" size={16} />
          </button>
        </div>
      ))}
      {field.allowAdd !== false && (
        <Btn
          variant="secondary"
          size="sm"
          icon="plus"
          disabled={max}
          data-add-row
          onClick={() => {
            const id = crypto.randomUUID()
            onChange([...rows, { id, values: {} }])
            focusRow(id)
          }}
        >
          Add Row
        </Btn>
      )}
      {max && (
        <p className="cm-hint">Maximum of {field.maxRows} rows reached.</p>
      )}
      {field.allowAdd === false && (
        <p className="cm-hint">
          Additional rows are not allowed by this template.
        </p>
      )}
    </div>
  )
}
