import { requirePreview } from "@/lib/require-preview"
import { loadPreviewRecord } from "@/modules/staff/data/record-loader"
import { isHouseTab } from "@/modules/staff/data/sections"
import { notFound } from "next/navigation"
import HouseProfile from "@/modules/staff/ui/HouseProfile"
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  requirePreview()
  const { id } = await params
  loadPreviewRecord("house", id)
  const query = await searchParams
  const tab = query.tab ?? "overview"
  if (!isHouseTab(tab)) notFound()
  if (
    tab === "files" &&
    ((query.fileId !== undefined && typeof query.fileId !== "string") ||
      (query.action !== undefined && typeof query.action !== "string"))
  )
    notFound()
  return <HouseProfile key={id} id={id} tab={tab} />
}
