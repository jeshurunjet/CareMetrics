import { requirePreview } from "@/lib/require-preview"
import { loadPreviewCareTemplate } from "@/modules/staff/data/record-loader"
import AssessmentForm from "@/modules/staff/care/AssessmentForm"
import { notFound } from "next/navigation"
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  requirePreview()
  const { id } = await params
  const { templateId, draft } = await searchParams
  if (
    typeof templateId !== "string" ||
    (draft !== undefined && typeof draft !== "string")
  )
    notFound()
  loadPreviewCareTemplate(id, templateId)
  return (
    <AssessmentForm
      key={`${id}-${templateId}-${draft ?? "new"}`}
      clientId={id}
      templateId={templateId}
      draftId={draft}
    />
  )
}
