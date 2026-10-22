"use client"
import type { Notice } from "../data/types"
import { formatDateTime as fmtDateTime } from "@/lib/time"
import { Icon, useNav } from "./index"
export default function NotificationCard({ n }: { n: Notice }) {
  const nav = useNav()
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
      {!n.read && <i className="cm-unread" aria-label="Unread" />}
    </button>
  )
}
