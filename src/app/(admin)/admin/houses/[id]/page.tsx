import { houseEditor, managementDirectory } from "@/server/admin/read"
import { HouseDetails } from "@/modules/admin/manage/ManagementDetails"
import { isBackendEnabled } from "@/server/config/backend"
import { staffPage } from "@/server/data/page"
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
  if (isBackendEnabled()) {
    const query = await searchParams
    validateAdminTab("houses", query.tab)
    return staffPage(
      async () => ({
        data: await houseEditor(id),
        directory: await managementDirectory(),
      }),
      (value) => (
        <HouseDetails
          {...value}
          tab={typeof query.tab === "string" ? query.tab : "overview"}
        />
      ),
    )
  }
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
