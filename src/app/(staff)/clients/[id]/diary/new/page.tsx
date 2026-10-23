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
  requirePreview()
  const { id } = await params
  const { draft } = await searchParams
  if (Array.isArray(draft)) notFound()
  return (
    <DiaryEntryForm
      key={`${id}-${draft ?? "new"}`}
      subject={{ scope: "client", targetId: id }}
      draftId={draft}
    />
  )
}
