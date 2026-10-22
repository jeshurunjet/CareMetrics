import { requirePreview } from "@/lib/require-preview"
import { developmentMockAdapter } from "@/modules/staff/data/development-mock-adapter"
import { notFound } from "next/navigation"
import StaffPlaceholder from "@/modules/staff/ui/StaffPlaceholder"
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  requirePreview()
  const { id } = await params
  const s = developmentMockAdapter.getSnapshot("s1", new Date().toISOString())
  const record = s.clients.find((x) => x.id === id)
  if (!record) notFound()
  return <StaffPlaceholder title={record.name} />
}
