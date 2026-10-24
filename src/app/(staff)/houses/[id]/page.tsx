import { isBackendEnabled } from "@/server/config/backend"
import { staffPage } from "@/server/data/page"
import { getHouseProfile, getStaffOverview } from "@/server/data/staff"
import { HouseRead } from "@/modules/staff/read/StaffReadViews"
import { requirePreview } from "@/lib/require-preview"
import { isHouseTab } from "@/modules/staff/data/sections"
import { notFound } from "next/navigation"
import HouseProfile from "@/modules/staff/ui/HouseProfile"
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
  if (!isHouseTab(tab)) notFound()
  if (isBackendEnabled())
    return staffPage(
      async () => {
        const profile = await getHouseProfile(id)
        const overview = await getStaffOverview()
        return { ...profile, houses: overview.houses }
      },
      (data) => <HouseRead {...data} tab={tab} />,
    )
  requirePreview()
  if (
    tab === "files" &&
    ((query.fileId !== undefined && typeof query.fileId !== "string") ||
      (query.action !== undefined && typeof query.action !== "string"))
  )
    notFound()
  return <HouseProfile key={id} id={id} tab={tab} />
}
