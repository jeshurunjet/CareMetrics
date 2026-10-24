import { isBackendEnabled } from "@/server/config/backend"
import { staffPage } from "@/server/data/page"
import { getManagementRecords } from "@/server/data/admin-read"
import { AdminRecordsRead } from "@/modules/admin/read/AdminReadViews"
import AdminAccess from "@/modules/admin/ui/AdminAccess"
import { requirePreview } from "@/lib/require-preview"
import HouseDirectory from "@/modules/admin/houses/HouseDirectory"
export default function Page() {
  if (isBackendEnabled())
    return staffPage(getManagementRecords, (data) => (
      <AdminRecordsRead data={data} kind="houses" />
    ))
  requirePreview()
  return (
    <AdminAccess>
      <HouseDirectory />
    </AdminAccess>
  )
}
