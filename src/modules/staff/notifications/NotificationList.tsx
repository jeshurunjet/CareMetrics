"use client"
import { useRouter } from "next/navigation"
import { useStaffData } from "../data/context"
import { Card, Icon, Empty } from "../ui"
import { formatDateTime } from "@/lib/time"
import { contextName, isNoticeRead } from "./adapter"
import NotificationStatus from "./NotificationStatus"
import type { Notice } from "../data/types"
export default function NotificationList({
  notices,
  base = "/notifications",
  empty = "No notifications",
}: {
  notices: Notice[]
  base?: string
  empty?: string
}) {
  const s = useStaffData(),
    router = useRouter()
  return notices.length === 0 ? (
    <Empty
      icon="bell"
      title={empty}
      text="You're all caught up. Try adjusting your filters."
    />
  ) : (
    <div className="cm-list">
      {notices.map((n) => (
        <Card
          key={n.id}
          className={`cm-notice-item cm-official-notice ${
            isNoticeRead(s, n.id) ? "" : "unread"
          }`}
          onClick={() =>
            router.push(
              `${base}${
                base.includes("?") ? "&" : "?"
              }item=${encodeURIComponent(n.id)}`,
            )
          }
        >
          <span className={`cm-notice-icon cm-notice-icon--${n.category}`}>
            <Icon
              name={
                n.category === "client"
                  ? "user"
                  : n.category === "house"
                    ? "house"
                    : "bell"
              }
              size={16}
            />
          </span>
          <div className="cm-grow">
            <strong>{n.title}</strong>
            <span>
              {n.category[0].toUpperCase() + n.category.slice(1)}
              {contextName(s, n.category, n.relatedId)
                ? ` · ${contextName(s, n.category, n.relatedId)}`
                : ""}{" "}
              · {formatDateTime(n.date)} · {n.publisher}
            </span>
            <p>{n.body?.slice(0, 160)}</p>
            <span className="cm-notice-labels">
              <NotificationStatus value={n.priority} />
              <span>{isNoticeRead(s, n.id) ? "Read" : "Unread"}</span>
              <span>View details</span>
            </span>
          </div>
          {!isNoticeRead(s, n.id) && (
            <i className="cm-unread" aria-label="Unread" />
          )}
        </Card>
      ))}
    </div>
  )
}
