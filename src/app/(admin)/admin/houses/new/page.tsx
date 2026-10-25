import { isBackendEnabled } from "@/server/config/backend"
import { staffPage } from "@/server/data/page"
import { houseEditor } from "@/server/admin/read"
import { HouseEditor } from "@/modules/admin/manage/ManagementForms"
import AdminAccess from "@/modules/admin/ui/AdminAccess"
import { requirePreview } from "@/lib/require-preview"
import HouseForm from "@/modules/admin/houses/HouseForm"
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  if (isBackendEnabled())
    return staffPage(
      () => houseEditor(),
      (data) => <HouseEditor data={data} />,
    )
  requirePreview()
  await searchParams
  return (
    <AdminAccess>
      <HouseForm />
    </AdminAccess>
  )
}
