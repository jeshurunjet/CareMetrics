import type { CareRecord, CareTemplate } from "../care/types"
import { allFields } from "../../forms/engine"
import { chartPoints } from "./history"
import { Card } from "../ui"
import { formatDateTime } from "@/lib/time"
const tickFormat = new Intl.DateTimeFormat("en-NZ", {
  timeZone: "Pacific/Auckland",
  day: "numeric",
  month: "numeric",
})
export default function ChartHistoryVisualisation({
  template,
  records,
}: {
  template: CareTemplate
  records: CareRecord[]
}) {
  if (!template.history?.chart) return null
  const points = chartPoints(template, records),
    unit = template.history.chart.unit
  const field = template.versions
    .flatMap(allFields)
    .find((f) => f.id === template.history?.chart?.fieldId)
  const max = Math.max(1, ...points.map((p) => p.value))
  return (
    <Card className="cm-panel">
      <h3 className="cm-h3">
        {field?.label ?? `Recorded values (${unit})`} — last {points.length}{" "}
        entries
      </h3>
      {!points.length ? (
        <p className="cm-muted">No numeric submitted values to chart.</p>
      ) : (
        <>
          <div
            className="cm-bars"
            role="img"
            aria-label={`Recorded ${unit} over time. A data table follows.`}
          >
            {points.map((p) => (
              <div key={p.id} className="cm-bar">
                <span
                  style={{ height: `${Math.max(0, (p.value / max) * 100)}%` }}
                >
                  <b>{p.value}</b>
                </span>
                <small>{tickFormat.format(new Date(p.at))}</small>
              </div>
            ))}
          </div>
          <details>
            <summary>View chart data table ({unit})</summary>
            <div
              className="cm-table-wrap"
              role="region"
              aria-label="Chart data alternative"
              tabIndex={0}
            >
              <table className="cm-table cm-table--compact">
                <caption className="sr-only">
                  Recorded duration in {unit}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Observed</th>
                    <th scope="col">{unit}</th>
                  </tr>
                </thead>
                <tbody>
                  {points.map((p) => (
                    <tr key={p.id}>
                      <th scope="row">{formatDateTime(p.at)}</th>
                      <td>{p.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </Card>
  )
}
