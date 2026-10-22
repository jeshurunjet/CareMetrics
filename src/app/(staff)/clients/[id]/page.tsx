import { requirePreview } from "@/lib/require-preview"
import {
  loadPreviewRecord,
  loadPreviewCareTemplate,
} from "@/modules/staff/data/record-loader"
import { isClientTab } from "@/modules/staff/data/sections"
import { notFound } from "next/navigation"
import ClientProfile from "@/modules/staff/ui/ClientProfile"
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  requirePreview()
  const { id } = await params
  loadPreviewRecord("client", id)
  const query = await searchParams
  const tab = query.tab ?? "overview"
  if (!isClientTab(tab)) notFound()
  if (tab === "care" && query.sub !== undefined) {
    if (typeof query.sub !== "string") notFound()
    loadPreviewCareTemplate(id, query.sub)
  }
  return <ClientProfile key={id} id={id} tab={tab} />
}
