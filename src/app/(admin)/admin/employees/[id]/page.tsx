import { isBackendEnabled } from "@/server/config/backend"
import { staffPage } from "@/server/data/page"
import { getManagementEmployee } from "@/server/data/admin-read"
import { AdminEmployeeRead } from "@/modules/admin/read/AdminReadViews"
import AdminAccess from "@/modules/admin/ui/AdminAccess"
import {
  validateAdminId,
  validateAdminTab,
} from "@/modules/admin/data/route-loader"
import EmployeeDetail from "@/modules/admin/employees/EmployeeDetail"
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
      () => getManagementEmployee(id),
      (data) => <AdminEmployeeRead employee={data} />,
    )
  validateAdminId("employees", id)
  const q = await searchParams
  validateAdminTab("employees", q.tab)
  return (
    <AdminAccess>
      <EmployeeDetail
        key={id}
        id={id}
        tab={typeof q.tab === "string" ? q.tab : undefined}
      />
    </AdminAccess>
  )
}
