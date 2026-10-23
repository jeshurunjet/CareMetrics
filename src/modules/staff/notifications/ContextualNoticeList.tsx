"use client"
import { useRouter } from "next/navigation"
import { useStaffData } from "../data/context"
import { formatDateTime } from "@/lib/time"
import NotificationStatus from "./NotificationStatus"
import { Card, Btn } from "../ui"
import { queryNotifications, queryConcerns } from "./adapter"
import NotificationList from "./NotificationList"
import ConcernHistory from "./ConcernHistory"
export default function ContextualNoticeList({
  context,
  targetId,
  compact = false,
}: {
  context: "client" | "house"
  targetId: string
  compact?: boolean
}) {
  const s = useStaffData(),
    router = useRouter(),
    base = `/notifications?tab=${context}&context=${context}&targetId=${encodeURIComponent(targetId)}`
  if (compact)
    return (
      <section
        className="cm-notifications"
        aria-label={`${context} official notices`}
      >
        {queryNotifications(s, context, { context, targetId })
          .slice(0, 1)
          .map((n) => (
            <div key={n.id} className="cm-notice-card cm-notice-card--hl">
              <div>
                <strong>{n.title}</strong>
                <span>
                  {formatDateTime(n.date)} · {n.publisher}
                </span>
              </div>
              <p>{n.body}</p>
              <NotificationStatus value={n.priority} />
              <Btn
                variant="ghost"
                size="sm"
                onClick={() =>
                  router.push(`${base}&item=${encodeURIComponent(n.id)}`)
                }
              >
                View notice details
              </Btn>
            </div>
          ))}
        <Btn variant="ghost" size="sm" onClick={() => router.push(base)}>
          View all notifications
        </Btn>
      </section>
    )
  return (
    <Card className="cm-panel cm-notifications">
      <div className="cm-row-between">
        <h2 className="cm-h3">
          {context === "house"
            ? "House notifications & concerns"
            : "Concerns & notices"}
        </h2>
        <Btn
          size="sm"
          variant="secondary"
          icon="flag"
          onClick={() => router.push(`${base}&action=new`)}
        >
          Submit concern
        </Btn>
      </div>
      <section aria-label={`${context} official notices`}>
        <div className="cm-row-between">
          <h3 className="cm-h3">Official notices</h3>
          <Btn variant="ghost" size="sm" onClick={() => router.push(base)}>
            View all notifications
          </Btn>
        </div>
        <NotificationList
          notices={queryNotifications(s, context, { context, targetId }).slice(
            0,
            3,
          )}
          base={base}
        />
      </section>
      <section aria-label="My contextual concerns">
        <h3 className="cm-h3">My submitted concerns</h3>
        <ConcernHistory
          concerns={queryConcerns(s, { context, targetId }).slice(0, 3)}
          base={`/notifications?tab=concerns&context=${context}&targetId=${encodeURIComponent(targetId)}`}
        />
      </section>
    </Card>
  )
}
