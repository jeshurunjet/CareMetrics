import type { CareRecord, CareTemplate } from "../care/types"
import { allFields } from "../../forms/engine"
/** Numeric, submitted, original-version values only. No zero-filling missing points. */
export function chartPoints(template: CareTemplate, records: CareRecord[]) {
  const chart = template.history?.chart
  if (!chart) return []
  return records
    .filter((r) => r.status !== "draft")
    .flatMap((r) => {
      const version = template.versions.find(
        (v) => v.version === r.templateVersion,
      )
      const originalChart = version?.name ? version.history?.chart : chart
      if (
        !originalChart ||
        originalChart.fieldId !== chart.fieldId ||
        originalChart.unit !== chart.unit
      )
        return []
      const field =
        version && allFields(version).find((f) => f.id === chart.fieldId)
      const value = r.values[chart.fieldId]
      return (field?.type === "number" || field?.type === "scale") &&
        typeof value === "number" &&
        Number.isFinite(value)
        ? [{ id: r.id, at: r.coveredAt, value }]
        : []
    })
    .sort((a, b) => a.at.localeCompare(b.at))
    .slice(-10)
}
