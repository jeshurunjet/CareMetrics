import AdminAccess from "@/modules/admin/ui/AdminAccess"
import { requirePreview } from "@/lib/require-preview"
import EmployeeForm from "@/modules/admin/employees/EmployeeForm"
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  requirePreview()
  await searchParams
  return (
    <AdminAccess>
      <EmployeeForm />
    </AdminAccess>
  )
}
