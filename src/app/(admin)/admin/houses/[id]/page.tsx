import { isBackendEnabled } from "@/server/config/backend"
import { staffPage } from "@/server/data/page"
import { getManagementHouse } from "@/server/data/admin-read"
import { AdminHouseRead } from "@/modules/admin/read/AdminReadViews"
import AdminAccess from "@/modules/admin/ui/AdminAccess"
import {
  validateAdminId,
  validateAdminTab,
} from "@/modules/admin/data/route-loader"
import HouseDetail from "@/modules/admin/houses/HouseDetail"
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  if (isBackendEnabled())
    return staffPage(
      () => getManagementHouse(id),
      (data) => <AdminHouseRead data={data} />,
    )
  validateAdminId("houses", id)
  const q = await searchParams
  validateAdminTab("houses", q.tab)
  return (
    <AdminAccess>
      <HouseDetail
        key={id}
        id={id}
        tab={typeof q.tab === "string" ? q.tab : undefined}
      />
    </AdminAccess>
  )
}
