"use client"
import type { ReactNode } from "react"
export default function Card({
  children,
  className = "",
  onClick,
  as,
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
  as?: "button"
}) {
  if (as === "button" || onClick)
    return (
      <button
        type="button"
        className={`cm-card cm-card--interactive ${className}`}
        onClick={onClick}
      >
        {children}
      </button>
    )
  return <section className={`cm-card ${className}`}>{children}</section>
}
