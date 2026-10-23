"use client"
import { useRouter } from "next/navigation"
import { useStaffData } from "../data/context"
import { Card, Empty } from "../ui"
import { formatDateTime } from "@/lib/time"
import { contextName } from "./adapter"
import NotificationStatus from "./NotificationStatus"
import type { Concern } from "./types"
export default function ConcernHistory({
  concerns,
  base = "/notifications?tab=concerns",
}: {
  concerns: Concern[]
  base?: string
}) {
  const s = useStaffData(),
    router = useRouter()
  return concerns.length === 0 ? (
    <Empty
      icon="flag"
      title="No concerns submitted"
      text="No own submissions match this view."
    />
  ) : (
    <div className="cm-list">
      {concerns.map((c) => (
        <Card
          key={c.id}
          className="cm-notice-item cm-concern-item"
          onClick={() =>
            router.push(`${base}&concernId=${encodeURIComponent(c.id)}`)
          }
        >
          <div className="cm-grow">
            <strong>{c.title}</strong>
            <span>
              {contextName(s, c.context, c.targetId)} · {c.priority} priority ·{" "}
              {formatDateTime(c.submittedAt)}
            </span>
            <p>{c.description.slice(0, 180)}</p>
            <span>View details</span>
          </div>
          <NotificationStatus value={c.status} />
        </Card>
      ))}
    </div>
  )
}
