import { isBackendEnabled } from "@/server/config/backend"
import { staffPage } from "@/server/data/page"
import { managementDirectory } from "@/server/admin/read"
import ManagementDirectory from "@/modules/admin/manage/ManagementDirectory"
import AdminAccess from "@/modules/admin/ui/AdminAccess"
import { requirePreview } from "@/lib/require-preview"
import HouseDirectory from "@/modules/admin/houses/HouseDirectory"
export default function Page() {
  if (isBackendEnabled())
    return staffPage(managementDirectory, (data) => (
      <ManagementDirectory data={data} kind="houses" />
    ))
  requirePreview()
  return (
    <AdminAccess>
      <HouseDirectory />
    </AdminAccess>
  )
}
