import AdminAccess from "@/modules/admin/ui/AdminAccess"
import { requirePreview } from "@/lib/require-preview"
import ClientDirectory from "@/modules/admin/clients/ClientDirectory"
export default function Page() {
  requirePreview()
  return (
    <AdminAccess>
      <ClientDirectory />
    </AdminAccess>
  )
}
