import { isBackendEnabled } from "@/server/config/backend"
import { deferredPage } from "@/server/data/deferred-page"
import { notFound } from "next/navigation"
import { requirePreview } from "@/lib/require-preview"
import Notifications from "@/modules/staff/notifications/Notifications"
import StaffRouteScopeGuard from "@/modules/preview/StaffRouteScopeGuard"
export default async function Page({
  searchParams,
}: PageProps<"/notifications">) {
  if (isBackendEnabled()) return deferredPage(false)

  requirePreview()
  const q = await searchParams
  if (
    Object.values(q).some(Array.isArray) ||
    (q.tab &&
      !["all", "client", "house", "staff", "concerns"].includes(
        q.tab as string,
      )) ||
    (q.action && q.action !== "new") ||
    [q.item, q.concernId, q.action].filter(Boolean).length > 1 ||
    !!q.context !== !!q.targetId ||
    (q.concernId && q.tab !== "concerns")
  )
    notFound()
  return (
    <StaffRouteScopeGuard kind="notifications" q={q}>
      <Notifications />
    </StaffRouteScopeGuard>
  )
}
