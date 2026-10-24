import AdminAccess from "@/modules/admin/ui/AdminAccess"
import DocumentationPage from "@/modules/admin/documentation/DocumentationPage"
import { requirePreview } from "@/lib/require-preview"
import { notFound } from "next/navigation"
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  requirePreview()
  const q = await searchParams
  if (
    Object.keys(q).some((k) => k !== "tab") ||
    (q.tab !== undefined &&
      (typeof q.tab !== "string" ||
        ![
          "overview",
          "categories",
          "care",
          "chart",
          "assignments",
          "records",
          "corrections",
        ].includes(q.tab)))
  )
    notFound()
  return (
    <AdminAccess>
      <DocumentationPage />
    </AdminAccess>
  )
}
