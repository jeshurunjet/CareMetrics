import AdminAccess from "@/modules/admin/ui/AdminAccess"
import { requirePreview } from "@/lib/require-preview"
import HouseForm from "@/modules/admin/houses/HouseForm"
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  requirePreview()
  await searchParams
  return (
    <AdminAccess>
      <HouseForm />
    </AdminAccess>
  )
}
