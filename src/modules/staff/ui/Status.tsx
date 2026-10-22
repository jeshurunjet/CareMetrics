"use client"
import type { ReactNode } from "react"
export type Tone = "brand" | "success" | "warning" | "danger" | "info" | "neutral"
export default function Status({
  tone = "neutral",
  children,
  dot = true,
}: {
  tone?: Tone
  children: ReactNode
  dot?: boolean
}) {
  return (
    <span className={`cm-status cm-status--${tone}`}>
      {dot && <i />}
      {children}
    </span>
  )
}
