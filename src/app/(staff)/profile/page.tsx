import { notFound } from "next/navigation"
import { requirePreview } from "@/lib/require-preview"
import MyProfile from "@/modules/staff/profile/MyProfile"
export default async function Page({ searchParams }: PageProps<"/profile">) {
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
