import AdminAccess from "@/modules/admin/ui/AdminAccess"
import TemplateEditor from "@/modules/admin/documentation/TemplateEditor"
import { validKey } from "@/modules/admin/documentation/validation"
import { requirePreview } from "@/lib/require-preview"
import { notFound } from "next/navigation"
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  requirePreview()
  const { id } = await params,
    q = await searchParams
  if (
    !validKey(id) ||
    Object.keys(q).some((k) => k !== "tab") ||
    (q.tab !== undefined &&
      (typeof q.tab !== "string" ||
        !["builder", "preview", "versions", "assign"].includes(q.tab)))
  )
    notFound()
  return (
    <AdminAccess>
      <TemplateEditor key={id} id={id} />
    </AdminAccess>
  )
}
