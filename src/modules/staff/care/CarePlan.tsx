"use client"
import { useSearchParams } from "next/navigation"
import CarePlanCategoryList from "./CarePlanCategoryList"
import AssessmentHistory from "./AssessmentHistory"
import AssessmentDetails from "./AssessmentDetails"
import { UnavailableAssessment } from "./shared"
export default function CarePlan({ clientId }: { clientId: string }) {
  const params = useSearchParams(),
    templateId = params.get("sub"),
    id = params.get("item")
  if (!templateId)
    return id ? (
      <UnavailableAssessment clientId={clientId} />
    ) : (
      <CarePlanCategoryList clientId={clientId} />
    )
  return id ? (
    <AssessmentDetails
      key={id}
      clientId={clientId}
      templateId={templateId}
      id={id}
    />
  ) : (
    <AssessmentHistory
      key={`${clientId}-${templateId}`}
      clientId={clientId}
      templateId={templateId}
    />
  )
}
