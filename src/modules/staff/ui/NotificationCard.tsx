"use client"
import { useStaffData } from "../data/context"
import { isNoticeRead } from "../notifications/adapter"
import NotificationStatus from "../notifications/NotificationStatus"
import type { Notice } from "../data/types"
import { formatDateTime as fmtDateTime } from "@/lib/time"
import { Icon, useNav } from "./index"
export default function NotificationCard({ n }: { n: Notice }) {
  const nav = useNav()
  const s = useStaffData()
  return (
    <button
      className="cm-notice-row"
      onClick={() => nav.go({ page: "notifications", item: n.id })}
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
          size={15}
        />
      </span>
      <div className="cm-grow">
        <strong>{n.title}</strong>
        <span>
          {fmtDateTime(n.date)} · {n.publisher}
        </span>
      </div>
      <NotificationStatus value={n.priority} />
      {!isNoticeRead(s, n.id) && (
        <i className="cm-unread" aria-label="Unread" />
      )}
    </button>
  )
}
