import AdminAccess from "@/modules/admin/ui/AdminAccess"
import FilesPage from "@/modules/admin/files/FilesPage"
import { validateQuery } from "@/modules/admin/governance/route-validation"
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const q = validateQuery(await searchParams, "files")
  return (
    <AdminAccess>
      <FilesPage fileId={q.fileId} />
    </AdminAccess>
  )
}
