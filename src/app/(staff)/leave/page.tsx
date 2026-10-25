import { isBackendEnabled } from "@/server/config/backend"
import { deferredPage } from "@/server/data/deferred-page"
import { notFound } from "next/navigation"
import { requirePreview } from "@/lib/require-preview"
import LeaveOverview from "@/modules/staff/leave/LeaveOverview"
export default async function Page({ searchParams }: PageProps<"/leave">) {
  if (isBackendEnabled()) return deferredPage(false)

  requirePreview()
  const q = await searchParams
  if (
    Array.isArray(q.requestId) ||
    Array.isArray(q.action) ||
    (q.action && q.action !== "new") ||
    (q.action && q.requestId)
  )
    notFound()
  return <LeaveOverview />
}
