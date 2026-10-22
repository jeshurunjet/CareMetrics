"use client"
import { useSearchParams } from "next/navigation"
import CarePlanCategoryList from "../care/CarePlanCategoryList"
import AssessmentDetails from "../care/AssessmentDetails"
import { UnavailableAssessment } from "../care/shared"
import ChartingHistoryTable from "./ChartingHistoryTable"
export default function Charting({ clientId }: { clientId: string }) {
  const params = useSearchParams(),
    templateId = params.get("sub"),
    id = params.get("item")
  if (!templateId)
    return id ? (
      <UnavailableAssessment clientId={clientId} kind="chart" />
    ) : (
      <CarePlanCategoryList clientId={clientId} kind="chart" />
    )
  return id ? (
    <AssessmentDetails
      key={id}
      clientId={clientId}
      templateId={templateId}
      id={id}
      kind="chart"
    />
  ) : (
    <ChartingHistoryTable
      key={`${clientId}-${templateId}`}
      clientId={clientId}
      templateId={templateId}
    />
  )
}
