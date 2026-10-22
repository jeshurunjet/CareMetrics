"use client"
import type { ReactNode } from "react"
import Icon from "@/components/Icon"
export default function Empty({
  icon = "search",
  title,
  text,
  action,
}: {
  icon?: string
  title: string
  text?: string
  action?: ReactNode
}) {
  return (
    <div className="cm-empty">
      <span>
        <Icon name={icon} size={22} />
      </span>
      <strong>{title}</strong>
      {text && <p>{text}</p>}
      {action}
    </div>
  )
}
