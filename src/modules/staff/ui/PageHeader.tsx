"use client"
import type { ReactNode } from "react"
import Icon from "@/components/Icon"
import { useNav, type StaffRoute as Route } from "../navigation"
export default function PageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
  back = false,
  crumbs,
}: {
  title: string
  subtitle?: ReactNode
  eyebrow?: string
  actions?: ReactNode
  back?: boolean
  crumbs?: {
    label: string
    route?: Route
  }[]
}) {
  const nav = useNav()
  return (
    <header className="cm-page-header">
      {(back || crumbs) && (
        <div className="cm-crumbs">
          {back && nav.canBack && (
            <button className="cm-back" onClick={nav.back} aria-label="Go back">
              <Icon name="back" size={16} />
              Back
            </button>
          )}
          {crumbs && (
            <nav aria-label="Breadcrumb" className="cm-crumb-list">
              {crumbs.map((c, i) => (
                <span key={i}>
                  {c.route ? (
                    <button onClick={() => nav.go(c.route!)}>{c.label}</button>
                  ) : (
                    <b>{c.label}</b>
                  )}
                  {i < crumbs.length - 1 && <Icon name="chevron" size={12} />}
                </span>
              ))}
            </nav>
          )}
        </div>
      )}
      <div className="cm-page-header-row">
        <div className="cm-page-title">
          {eyebrow && <span className="cm-eyebrow">{eyebrow}</span>}
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {actions && <div className="cm-page-actions">{actions}</div>}
      </div>
    </header>
  )
}
