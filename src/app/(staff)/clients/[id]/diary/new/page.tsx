import { isBackendEnabled } from "@/server/config/backend"
import { staffPage } from "@/server/data/page"
import { diaryEditor } from "@/server/diary/service"
import DiaryForm from "@/modules/diary/DiaryForm"
import { requirePreview } from "@/lib/require-preview"
import DiaryEntryForm from "@/modules/staff/diary/DiaryEntryForm"
import { notFound } from "next/navigation"
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ draft?: string | string[] }>
}) {
  const { id } = await params
  const { draft } = await searchParams
  if (isBackendEnabled()) {
    if (Object.keys(await searchParams).length) notFound()
    return staffPage(
      () => diaryEditor(id),
      (data) => <DiaryForm key={id} data={data} />,
    )
  }
  requirePreview()
  if (Array.isArray(draft)) notFound()
  return (
    <DiaryEntryForm
      key={`${id}-${draft ?? "new"}`}
      subject={{ scope: "client", targetId: id }}
      draftId={draft}
    />
  )
}
