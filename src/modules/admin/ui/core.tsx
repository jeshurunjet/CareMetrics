"use client"
/* ---------- Status tones ---------- */

/* ---------- Layout pieces ---------- */
/* ---------- Data table ---------- */
import { useMemo, useState, type ReactNode } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Icon, Status, Empty, Skeleton } from "@/modules/staff/ui"
import Pagination from "@/modules/staff/ui/Pagination"
import SearchInput from "@/modules/staff/ui/SearchInput"
import Select from "@/modules/staff/ui/Select"
import type { Tone } from "@/modules/staff/ui/Status"
import { usePreviewSession } from "@/modules/preview/context"
import { adminHref, type AdminRoute } from "../navigation"
export function useAdmin() {
  const router = useRouter(),
    path = usePathname(),
    q = useSearchParams(),
    session = usePreviewSession()
  return {
    ...session,
    route: {
      page: path.split("/")[2] ?? "dashboard",
      id: path.split("/")[3],
      tab: q.get("tab") ?? undefined,
    },
    canBack: true,
    go: (r: AdminRoute) => router.push(adminHref(r)),
    replace: (r: AdminRoute) => router.replace(adminHref(r)),
    back: () => router.back(),
  }
}
const TONES: Record<string, Tone> = {
  Active: "success",
  Inactive: "neutral",
  Invited: "info",
  Draft: "warning",
  Published: "success",
  Archived: "neutral",
  Scheduled: "info",
  "In Progress": "brand",
  "Clocked in": "brand",
  Completed: "success",
  Submitted: "info",
  "Pending Review": "warning",
  Pending: "warning",
  Approved: "success",
  Rejected: "danger",
  Declined: "danger",
  Resolved: "success",
  Closed: "neutral",
  "Under review": "warning",
  Cancelled: "neutral",
  Missed: "danger",
  "GPS failed": "danger",
  "Not started": "neutral",
  Late: "warning",
  Paused: "neutral",
  Verified: "success",
  "Not verified": "danger",
  High: "danger",
  Urgent: "danger",
  Medium: "warning",
  Normal: "neutral",
  Low: "neutral",
  "Off-shift": "info",
  Removed: "danger",
  Available: "success",
}
export function Pill({ s, label }: PillProps) {
  return <Status tone={TONES[s] ?? "neutral"}>{label ?? s}</Status>
}
const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  employees: "Employees",
  employee: "Employees",
  "employee-form": "Employees",
  houses: "Houses",
  house: "Houses",
  "house-form": "Houses",
  clients: "Clients",
  client: "Clients",
  "client-form": "Clients",
  roster: "Rosters & Attendance",
  docs: "Care Documentation",
  template: "Care Documentation",
  record: "Care Documentation",
  correction: "Care Documentation",
  files: "Files & Galleries",
  notices: "Notifications & Concerns",
  "notice-form": "Notifications & Concerns",
  concern: "Notifications & Concerns",
  leave: "Leave Management",
  reports: "Reports & Audit",
  settings: "Settings",
}
const ROOT: Record<string, string> = {
  employee: "employees",
  "employee-form": "employees",
  house: "houses",
  "house-form": "houses",
  client: "clients",
  "client-form": "clients",
  template: "docs",
  record: "docs",
  correction: "docs",
  "notice-form": "notices",
  concern: "notices",
}
export const sectionOf = (page: string) => ROOT[page] ?? page
export const sectionLabel = (page: string) => LABELS[page] ?? "CareMetrics"

export function PageHead({
  title,
  sub,
  actions,
  crumbs,
  children,
}: {
  title: ReactNode
  sub?: ReactNode
  actions?: ReactNode
  crumbs?: AdminCrumb[]
  children?: ReactNode
}) {
  const nav = useAdmin()
  return (
    <header className="ad-head">
      {crumbs && (
        <nav className="ad-crumbs" aria-label="Breadcrumb">
          {nav.canBack && (
            <button className="ad-backlink" onClick={nav.back}>
              <Icon name="back" size={14} />
              Back
            </button>
          )}
          {crumbs.map((c, i) => (
            <span key={i}>
              {c.to ? (
                <button onClick={() => nav.go(c.to!)}>{c.label}</button>
              ) : (
                <b>{c.label}</b>
              )}
              {i < crumbs.length - 1 && <Icon name="chevron" size={12} />}
            </span>
          ))}
        </nav>
      )}
      <div className="ad-head-row">
        <div className="ad-head-title">
          <h1>{title}</h1>
          {sub && <p>{sub}</p>}
        </div>
        {actions && <div className="ad-head-actions">{actions}</div>}
      </div>
      {children}
    </header>
  )
}
export function Panel({
  title,
  actions,
  children,
  className = "",
  pad = true,
}: {
  title?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
  pad?: boolean
}) {
  return (
    <section className={`ad-panel ${pad ? "ad-panel--pad" : ""} ${className}`}>
      {(title || actions) && (
        <div className="ad-panel-head">
          {title && <h2>{title}</h2>}
          {actions && <div className="ad-panel-actions">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}
export function SubTabs({
  tabs,
  value,
  onChange,
}: {
  tabs: AdminTab[]
  value: string
  onChange: (id: string) => void
}) {
  return (
    <div className="ad-tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          className={value === t.id ? "active" : ""}
          onClick={() => onChange(t.id)}
        >
          {t.locked && <Icon name="shield" size={13} />}
          {t.label}
          {t.count !== undefined && t.count > 0 && <span>{t.count}</span>}
        </button>
      ))}
    </div>
  )
}
export function Stat({
  label,
  value,
  sub,
  icon,
  tone = "brand",
  onClick,
}: {
  label: string
  value: ReactNode
  sub?: string
  icon: string
  tone?: string
  onClick?: () => void
}) {
  return (
    <button
      className={`ad-stat ad-stat--${tone}`}
      onClick={onClick}
      disabled={!onClick}
    >
      <span className="ad-stat-icon">
        <Icon name={icon} size={18} />
      </span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {sub && <small>{sub}</small>}
      </div>
    </button>
  )
}
export function KV({
  items,
  cols = 2,
}: {
  items: [string, ReactNode][]
  cols?: number
}) {
  return (
    <dl
      className="ad-kv"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {items.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>
            {v === "" || v === undefined || v === null ? (
              <span className="ad-faint">—</span>
            ) : (
              v
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}
export function Locked({
  text = "Your role does not permit this action.",
}: {
  text?: string
}) {
  return (
    <div className="ad-locked">
      <Icon name="shield" size={15} />
      {text}
    </div>
  )
}
export interface Col<T> {
  key: string
  label: string
  render: (row: T) => ReactNode
  width?: string
  sort?: (row: T) => string | number
}
export function DataTable<T extends { id?: string }>({
  rows,
  cols,
  onRow,
  empty,
  per = 10,
  rowKey,
  loading,
}: {
  rows: T[]
  cols: Col<T>[]
  onRow?: (row: T) => void
  empty?: ReactNode
  per?: number
  rowKey?: (r: T, i: number) => string
  loading?: boolean
}) {
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<AdminSort | null>(null)
  const [rowCount, setRowCount] = useState(rows.length)
  if (rowCount !== rows.length) {
    setRowCount(rows.length)
    setPage(1)
  }
  const sorted = useMemo(() => {
    if (!sort) return rows
    const c = cols.find((x) => x.key === sort.key)
    if (!c?.sort) return rows
    return [...rows].sort((a, b) => {
      const x = c.sort!(a),
        y = c.sort!(b)
      return (x > y ? 1 : x < y ? -1 : 0) * sort.dir
    })
  }, [rows, sort, cols])
  if (loading)
    return (
      <div className="ad-table-wrap ad-pad">
        <Skeleton rows={5} />
      </div>
    )
  if (rows.length === 0) return <>{empty ?? <Empty title="No records" />}</>
  return (
    <div className="ad-table-block">
      <div
        className="ad-table-wrap"
        tabIndex={0}
        role="region"
        aria-label="Management records table"
      >
        <table className="ad-table">
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c.key} style={{ width: c.width }}>
                  {c.sort ? (
                    <button
                      onClick={() =>
                        setSort(
                          sort?.key === c.key
                            ? { key: c.key, dir: sort.dir === 1 ? -1 : 1 }
                            : { key: c.key, dir: 1 },
                        )
                      }
                    >
                      {c.label}
                      <Icon
                        name={
                          sort?.key === c.key && sort.dir === -1
                            ? "down"
                            : "down"
                        }
                        size={12}
                      />
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.slice((page - 1) * per, page * per).map((r, i) => (
              <tr
                key={rowKey ? rowKey(r, i) : (r.id ?? i)}
                onClick={onRow ? () => onRow(r) : undefined}
                className={onRow ? "ad-row-link" : ""}
                tabIndex={onRow ? 0 : undefined}
                onKeyDown={
                  onRow
                    ? (e) => {
                        if (e.key === "Enter" && e.target === e.currentTarget)
                          onRow(r)
                      }
                    : undefined
                }
              >
                {cols.map((c) => (
                  <td key={c.key}>{c.render(r)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        total={rows.length}
        per={per}
        onChange={setPage}
      />
    </div>
  )
}
export function Filters({ children }: { children: ReactNode }) {
  return <div className="ad-filters">{children}</div>
}
export { SearchInput, Select }

interface PillProps {
  s: string
  label?: string
}
interface AdminCrumb {
  label: string
  to?: AdminRoute
}
interface AdminTab {
  id: string
  label: string
  count?: number
  locked?: boolean
}
interface AdminSort {
  key: string
  dir: 1 | -1
}
