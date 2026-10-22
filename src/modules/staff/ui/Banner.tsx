"use client"
import type { ReactNode } from "react"
import Icon from "@/components/Icon"
export type Tone = "brand" | "success" | "warning" | "danger" | "info" | "neutral"
export default function Banner({
  tone = "info",
  title,
  children,
  action,
}: {
  tone?: Tone
  title?: string
  children?: ReactNode
  action?: ReactNode
}) {
  return (
    <div
      className={`cm-banner cm-banner--${tone}`}
      role={tone === "danger" ? "alert" : undefined}
    >
      <Icon
        name={tone === "success" ? "check" : tone === "info" ? "info" : "alert"}
        size={18}
      />
      <div>
        {title && <strong>{title}</strong>}
        {children && <div>{children}</div>}
      </div>
      {action}
    </div>
  )
}
