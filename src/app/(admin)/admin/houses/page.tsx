import AdminAccess from "@/modules/admin/ui/AdminAccess"
import { requirePreview } from "@/lib/require-preview"
import HouseDirectory from "@/modules/admin/houses/HouseDirectory"
export default function Page() {
  requirePreview()
  return (
    <AdminAccess>
      <HouseDirectory />
    </AdminAccess>
  )
}
