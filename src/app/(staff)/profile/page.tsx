import { staffPage } from "@/server/data/page"
import { getCurrentStaff } from "@/server/data/staff"
import { ProfileRead } from "@/modules/staff/read/StaffReadViews"
import { isBackendEnabled } from "@/server/config/backend"
import { notFound } from "next/navigation"
import { requirePreview } from "@/lib/require-preview"
import MyProfile from "@/modules/staff/profile/MyProfile"
export default async function Page({ searchParams }: PageProps<"/profile">) {
  if (isBackendEnabled())
    return staffPage(getCurrentStaff, (data) => <ProfileRead employee={data} />)
  requirePreview()
  const q = await searchParams
  if (
    Object.keys(q).some((k) => k !== "action") ||
    Array.isArray(q.action) ||
    (q.action && !["edit", "photo"].includes(q.action))
  )
    notFound()
  return <MyProfile />
}
