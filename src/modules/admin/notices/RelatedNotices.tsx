"use client"
import Link from "next/link"
import { useAdmin, Panel, DataTable, Pill } from "../ui/core"
import { Empty } from "../../staff/ui"
import { noticeHref, concernHref } from "./NoticesPage"
import { formatDateTime } from "@/lib/time"
export default function RelatedNotices({
  scope,
  id,
}: {
  scope: "client" | "house"
  id: string
}) {
  const { data: s } = useAdmin()
  const notices = s.notices.filter(
      (n) => n.category === scope && n.relatedId === id,
    ),
    concerns = s.concerns.filter(
      (c) => c.context === scope && c.targetId === id,
    )
  return (
    <div className="ad-grid-2">
      <Panel
        title="Notifications"
        pad={false}
        actions={
          <Link className="ad-link" href="/admin/notifications/new">
            New notification
          </Link>
        }
      >
        <DataTable
          rows={notices}
          empty={<Empty title="No notifications" />}
          cols={[
            {
              key: "title",
              label: "Title",
              render: (n) => (
                <Link className="ad-link" href={noticeHref(n.id)}>
                  {n.title}
                </Link>
              ),
            },
            {
              key: "status",
              label: "Status",
              render: (n) => <Pill s={n.status} />,
            },
            {
              key: "date",
              label: "Updated",
              render: (n) => formatDateTime(n.date),
            },
          ]}
        />
      </Panel>
      <Panel title="Concerns" pad={false}>
        <DataTable
          rows={concerns}
          empty={<Empty title="No concerns raised" />}
          cols={[
            {
              key: "title",
              label: "Concern",
              render: (c) => (
                <Link className="ad-link" href={concernHref(c.id)}>
                  {c.title}
                </Link>
              ),
            },
            {
              key: "priority",
              label: "Priority",
              render: (c) => <Pill s={c.priority} />,
            },
            {
              key: "status",
              label: "Status",
              render: (c) => <Pill s={c.status} />,
            },
          ]}
        />
      </Panel>
    </div>
  )
}
