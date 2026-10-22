"use client"
import Link from "next/link"
import { useStaffData } from "../data/context"
import { getAssignedCareTemplates, getCareRecords } from "./adapter"
import { Card, Empty, Icon } from "../ui"
import { formatDate } from "@/lib/time"
import { careHistoryHref, careFormHref } from "./navigation"
import { AssessmentPreviewNotice } from "./shared"
export default function CarePlanCategoryList({
  clientId,
  kind = "care",
}: {
  clientId: string
  kind?: "care" | "chart"
}) {
  const s = useStaffData(),
    assigned = getAssignedCareTemplates(s, clientId, kind)
  if (!assigned.length)
    return (
      <Empty
        icon={kind === "chart" ? "chart" : "clipboard"}
        title={
          kind === "chart"
            ? "No charting categories are currently assigned to this client."
            : "No care plan assessments are currently assigned to this client."
        }
      />
    )
  return (
    <div className="cm-stack">
      <AssessmentPreviewNotice kind={kind} />
      <div className="cm-category-grid">
        {assigned.map(({ template, version }) => {
          const records = getCareRecords(s, clientId, template.id).filter(
            (r) => r.status !== "draft",
          )
          return (
            <Card key={template.id} className="cm-category">
              <span className="cm-category-icon">
                <Icon
                  name={kind === "chart" ? "chart" : "clipboard"}
                  size={20}
                />
              </span>
              <div className="cm-grow">
                <strong>{template.name}</strong>
                <span>{template.description}</span>
                <small>
                  {records.length} records
                  {records[0]
                    ? ` · last ${formatDate(records[0].submittedAt ?? records[0].createdAt)}`
                    : ""}{" "}
                  · Template v{version.version}
                </small>
                <div className="cm-row-actions">
                  <Link
                    className="cm-btn cm-btn--secondary cm-btn--sm"
                    href={careHistoryHref(clientId, template.id, kind)}
                  >
                    {kind === "chart" ? "View chart / history" : "View records"}
                    <span className="sr-only"> · {template.name}</span>
                  </Link>
                  <Link
                    className="cm-btn cm-btn--primary cm-btn--sm"
                    href={careFormHref(clientId, template.id)}
                  >
                    Add entry<span className="sr-only"> · {template.name}</span>
                  </Link>
                </div>
              </div>
              <Icon name="chevron" size={17} />
            </Card>
          )
        })}
      </div>
    </div>
  )
}
