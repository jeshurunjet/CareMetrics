import { isBackendEnabled } from "@/server/config/backend"
import { careEditor } from "@/server/care/service"
import { staffPage } from "@/server/data/page"
import CarePlanForm from "@/modules/care-plan/CarePlanForm"
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
  const { id } = await params
  const query = await searchParams
  const { templateId, draft } = query
  if (isBackendEnabled()) {
    if (
      Object.keys(query).some((k) => k !== "templateId") ||
      typeof templateId !== "string"
    )
      notFound()
    return staffPage(
      () => careEditor(id, templateId),
      (data) => (
        <CarePlanForm
          key={`${id}-${templateId}-${data.form.version}`}
          data={data}
        />
      ),
    )
  }
  requirePreview()
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
