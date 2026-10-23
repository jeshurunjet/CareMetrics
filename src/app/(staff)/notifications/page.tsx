import { notFound } from "next/navigation"
import { requirePreview } from "@/lib/require-preview"
import Notifications from "@/modules/staff/notifications/Notifications"
import { developmentMockAdapter } from "@/modules/staff/data/development-mock-adapter"
import { canSubmitConcern } from "@/modules/staff/notifications/adapter"
export default async function Page({
  searchParams,
}: PageProps<"/notifications">) {
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
  if (q.context && q.targetId) {
    const s = developmentMockAdapter.getSnapshot(
      "s1",
      process.env.CAREMETRICS_DEMO_NOW || new Date().toISOString(),
    )
    if (!canSubmitConcern(s, q.context as string, q.targetId as string))
      notFound()
  }
  return <Notifications />
}
