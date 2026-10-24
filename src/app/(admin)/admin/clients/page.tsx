import { isBackendEnabled } from "@/server/config/backend"
import { staffPage } from "@/server/data/page"
import { getManagementRecords } from "@/server/data/admin-read"
import { AdminRecordsRead } from "@/modules/admin/read/AdminReadViews"
import AdminAccess from "@/modules/admin/ui/AdminAccess"
import { requirePreview } from "@/lib/require-preview"
import ClientDirectory from "@/modules/admin/clients/ClientDirectory"
export default function Page() {
  if (isBackendEnabled())
    return staffPage(getManagementRecords, (data) => (
      <AdminRecordsRead data={data} kind="clients" />
    ))
  requirePreview()
  return (
    <AdminAccess>
      <ClientDirectory />
    </AdminAccess>
  )
}
