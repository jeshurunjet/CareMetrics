import type {
  CareTableRow,
  FormFieldDefinition,
  RepeatingTableDefinition,
} from "../../forms/types"
import { display } from "../../forms/ReadOnlyFormValues"
export default function TableDifferences({
  field,
  before,
  after,
}: {
  field: FormFieldDefinition & RepeatingTableDefinition
  before: CareTableRow[]
  after: CareTableRow[]
}) {
  const ids = Array.from(
    new Set([...before.map((r) => r.id), ...after.map((r) => r.id)]),
  )
  return (
    <div
      className="ad-table-wrap"
      role="region"
      aria-label="Proposed table differences"
      tabIndex={0}
    >
      <table className="ad-table">
        <thead>
          <tr>
            <th>Stable row</th>
            <th>Change</th>
            <th>Column</th>
            <th>Previous value</th>
            <th>Proposed value</th>
          </tr>
        </thead>
        <tbody>
          {ids.flatMap((id) => {
            const old = before.find((r) => r.id === id),
              next = after.find((r) => r.id === id)
            return field.columns
              .filter(
                (col) =>
                  !old || !next || old.values[col.id] !== next.values[col.id],
              )
              .map((col) => (
                <tr key={`${id}:${col.id}`}>
                  <th scope="row">{id}</th>
                  <td>
                    {!old
                      ? "Added row"
                      : !next
                        ? "Removed row"
                        : "Changed cell"}
                  </td>
                  <td>
                    {col.label} · {col.id}
                  </td>
                  <td>
                    <del>{display(col, old?.values[col.id])}</del>
                  </td>
                  <td>
                    <ins>{display(col, next?.values[col.id])}</ins>
                  </td>
                </tr>
              ))
          })}
        </tbody>
      </table>
      <p>
        Row order: {after.map((r) => r.id).join(" → ") || "No rows"}. Original
        rows remain in submission history.
      </p>
    </div>
  )
}
