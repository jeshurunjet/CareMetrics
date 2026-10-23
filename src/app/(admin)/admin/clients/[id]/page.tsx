import AdminAccess from "@/modules/admin/ui/AdminAccess"
import {
  validateAdminId,
  validateAdminTab,
} from "@/modules/admin/data/route-loader"
import ClientDetail from "@/modules/admin/clients/ClientDetail"
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  validateAdminId("clients", id)
  const q = await searchParams
  validateAdminTab("clients", q.tab)
  return (
    <AdminAccess>
      <ClientDetail
        key={id}
        id={id}
        tab={typeof q.tab === "string" ? q.tab : undefined}
      />
    </AdminAccess>
  )
}
