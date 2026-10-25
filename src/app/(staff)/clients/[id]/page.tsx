import { carePage } from "@/server/care/service"
import CarePlanView from "@/modules/care-plan/CarePlanView"
import { diaryHistory } from "@/server/diary/service"
import DiaryHistoryView from "@/modules/diary/DiaryViews"
import { isBackendEnabled } from "@/server/config/backend"
import { staffPage } from "@/server/data/page"
import { getClientProfile } from "@/server/data/staff"
import { ClientRead } from "@/modules/staff/read/StaffReadViews"
import { requirePreview } from "@/lib/require-preview"
import StaffCareScopeGuard from "@/modules/preview/StaffCareScopeGuard"
import { isClientTab } from "@/modules/staff/data/sections"
import { notFound } from "next/navigation"
import ClientProfile from "@/modules/staff/ui/ClientProfile"
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  const query = await searchParams
  const tab = query.tab ?? "overview"
  if (!isClientTab(tab)) notFound()
  if (isBackendEnabled()) {
    if (tab === "care") {
      const { tab: ignored, ...filters } = query
      void ignored
      return staffPage(
        async () => ({
          client: await getClientProfile(id),
          care: await carePage(id, filters),
        }),
        ({ client, care }) => (
          <ClientRead
            client={client}
            tab={tab}
            care={<CarePlanView clientId={id} data={care} />}
          />
        ),
      )
    }
    if (tab === "diary") {
      const { tab: ignored, ...filters } = query
      void ignored
      return staffPage(
        async () => ({
          client: await getClientProfile(id),
          diary: await diaryHistory(id, filters),
        }),
        ({ client, diary }) => (
          <ClientRead
            client={client}
            tab={tab}
            diary={<DiaryHistoryView clientId={id} data={diary} />}
          />
        ),
      )
    }
    return staffPage(
      () => getClientProfile(id),
      (client) => <ClientRead client={client} tab={tab} />,
    )
  }
  requirePreview()
  if ((tab === "care" || tab === "charting") && query.sub !== undefined) {
    if (typeof query.sub !== "string") notFound()
  }
  if (
    tab === "files" &&
    ((query.fileId !== undefined && typeof query.fileId !== "string") ||
      (query.action !== undefined && typeof query.action !== "string"))
  )
    notFound()
  const profile = <ClientProfile key={id} id={id} tab={tab} />
  return (tab === "care" || tab === "charting") &&
    typeof query.sub === "string" ? (
    <StaffCareScopeGuard
      clientId={id}
      templateId={query.sub}
      kind={tab === "charting" ? "chart" : "care"}
    >
      {profile}
    </StaffCareScopeGuard>
  ) : (
    profile
  )
}
