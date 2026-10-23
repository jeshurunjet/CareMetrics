import { requirePreview } from "@/lib/require-preview"
import AssessmentEntryRoute from "@/modules/preview/AssessmentEntryRoute"
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
  return (
    <AssessmentEntryRoute
      key={`${id}-${templateId}-${draft ?? "new"}`}
      clientId={id}
      templateId={templateId}
      draftId={draft}
    />
  )
}
