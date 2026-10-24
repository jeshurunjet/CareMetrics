"use client"
import type { Client } from "../data/types"
import { Card, Avatar, Icon, useNav } from "./index"
export default function ClientCard({
  c,
  houseName,
}: {
  c: Pick<Client, "id" | "name"> & Partial<Pick<Client, "tone" | "photo" | "alerts">>
  houseName?: string
}) {
  const nav = useNav()
  return (
    <Card
      className="cm-client-card"
      onClick={() => nav.go({ page: "client", id: c.id })}
    >
      <Avatar name={c.name} tone={c.tone} size={44} photo={c.photo} />
      <div className="cm-grow">
        <strong>{c.name}</strong>
        <span>{houseName}</span>
      </div>
      {(c.alerts?.length ?? 0) > 0 && (
        <span
          className="cm-alert-dot"
          title={`${c.alerts?.length ?? 0} alert(s)`}
        >
          <Icon name="alert" size={14} />
        </span>
      )}
      <Icon name="chevron" size={16} />
    </Card>
  )
}
