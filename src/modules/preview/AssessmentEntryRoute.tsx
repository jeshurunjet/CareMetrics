"use client"
import { notFound } from "next/navigation"
import { useStaffData } from "../staff/data/context"
import { getAssignedCareTemplate } from "../staff/care/adapter"
import AssessmentForm from "../staff/care/AssessmentForm"
export default function AssessmentEntryRoute({
  clientId,
  templateId,
  draftId,
}: {
  clientId: string
  templateId: string
  draftId?: string
}) {
  const s = useStaffData(),
    kind = s.careTemplates.find((t) => t.id === templateId)?.kind
  const assigned =
    kind && getAssignedCareTemplate(s, clientId, templateId, kind)
  if (!assigned) notFound()
  return (
    <AssessmentForm
      key={`${clientId}-${templateId}-${draftId ?? "new"}`}
      kind={assigned.template.kind}
      clientId={clientId}
      templateId={templateId}
      draftId={draftId}
    />
  )
}
