import AdminAccess from "@/modules/admin/ui/AdminAccess"
import { requirePreview } from "@/lib/require-preview"
import FutureModule from "@/modules/admin/ui/FutureModule"
export default function Page() {
  requirePreview()
  return (
    <AdminAccess>
      <FutureModule title="Leave Management" />
    </AdminAccess>
  )
}
