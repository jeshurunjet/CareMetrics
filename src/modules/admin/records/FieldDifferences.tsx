import TableDifferences from "./TableDifferences"
import type { StaffSnapshot, CorrectionRequest } from "../../staff/data/types"
import type { SubmittedRecord } from "./adapter"
import { proposalField } from "../../staff/documentation/proposals"
import { effectiveCare } from "../../staff/documentation/revisions"
import { allFields, isTableRows } from "../../forms/engine"
import { display } from "../../forms/ReadOnlyFormValues"
export default function FieldDifferences({
  s,
  record: r,
  request: c,
}: {
  s: StaffSnapshot
  record: SubmittedRecord
  request: CorrectionRequest
}) {
  if (!r.care || c.proposal?.kind !== "care") return null
  return (
    <div className="ad-stack" role="region" aria-label="Affected fields">
      {c.proposal.changes.map((change, i) => {
        try {
          const field = proposalField(s, r.care!, change.target),
            values = effectiveCare(s, r.care!).values,
            value = values[change.target.fieldId],
            before =
              change.target.rowId && isTableRows(value)
                ? value.find((row) => row.id === change.target.rowId)?.values[
                    change.target.columnId!
                  ]
                : value
          const section = r.version?.sections.find((section) =>
            section.fields.some((f) => f.id === change.target.fieldId),
          )
          const originalField = allFields(r.version!).find(
            (f) => f.id === change.target.fieldId,
          )
          return (
            <div key={i} className="ad-reason">
              <h3>
                {section?.title} · {originalField?.label}
              </h3>
              <p>{field.label}</p>
              <p className="ad-faint">
                Stable reference: {change.target.fieldId}
                {change.target.rowId
                  ? ` / ${change.target.rowId} / ${change.target.columnId}`
                  : ""}
              </p>
              {field.type === "repeatingTable" &&
              isTableRows(before) &&
              isTableRows(change.value) ? (
                <TableDifferences
                  field={field}
                  before={before}
                  after={change.value}
                />
              ) : (
                <>
                  <p>
                    <b>Previous effective value:</b>{" "}
                    <del>
                      {field.type === "repeatingTable"
                        ? JSON.stringify(before)
                        : display(field, before)}
                    </del>
                  </p>
                  <p>
                    <b>
                      Proposed replacement
                      {change.value === "" ? " (clear value)" : ""}:
                    </b>{" "}
                    <ins>
                      {field.type === "repeatingTable"
                        ? JSON.stringify(change.value)
                        : display(field, change.value)}
                    </ins>
                  </p>
                </>
              )}
            </div>
          )
        } catch {
          return (
            <p role="alert" key={i}>
              Invalid or unsupported original field/table reference.
            </p>
          )
        }
      })}
    </div>
  )
}
