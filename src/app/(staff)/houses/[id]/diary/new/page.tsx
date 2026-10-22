import { requirePreview } from "@/lib/require-preview"
import { loadPreviewRecord } from "@/modules/staff/data/record-loader"
import DiaryEntryForm from "@/modules/staff/diary/DiaryEntryForm"
import { notFound } from "next/navigation"
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ draft?: string | string[] }>
}) {
  requirePreview()
  const { id } = await params
  loadPreviewRecord("house", id)
  const { draft } = await searchParams
  if (Array.isArray(draft)) notFound()
  return (
    <DiaryEntryForm
      key={`${id}-${draft ?? "new"}`}
      subject={{ scope: "house", targetId: id }}
      draftId={draft}
    />
  )
}
