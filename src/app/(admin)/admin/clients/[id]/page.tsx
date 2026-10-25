import { diaryHistory } from "@/server/diary/service"
import DiaryHistoryView from "@/modules/diary/DiaryViews"
import { clientEditor } from "@/server/admin/read"
import { ClientDetails } from "@/modules/admin/manage/ManagementDetails"
import { isBackendEnabled } from "@/server/config/backend"
import { staffPage } from "@/server/data/page"
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
  if (isBackendEnabled()) {
    const query = await searchParams
    validateAdminTab("clients", query.tab)
    if (query.tab === "diary") {
      const { tab: ignored, ...filters } = query
      void ignored
      return staffPage(
        async () => ({
          data: await clientEditor(id),
          diary: await diaryHistory(id, filters, true),
        }),
        ({ data, diary }) => (
          <ClientDetails
            data={data}
            tab="diary"
            diary={<DiaryHistoryView clientId={id} data={diary} admin />}
          />
        ),
      )
    }
    return staffPage(
      () => clientEditor(id),
      (data) => (
        <ClientDetails
          data={data}
          tab={typeof query.tab === "string" ? query.tab : "overview"}
        />
      ),
    )
  }
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
