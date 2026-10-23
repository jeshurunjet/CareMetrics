"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import Icon from "@/components/Icon"
import AdminHeader from "@/modules/admin/ui/AdminHeader"
import { usePreviewSession } from "@/modules/preview/context"
import { canManage } from "@/modules/admin/data/adapter"
import { Locked } from "@/modules/admin/ui/core"
import type { StaffSnapshot } from "@/modules/staff/data/types"
const groups = [
  {
    title: "Main",
    items: [
      ["dashboard", "Dashboard", "home"],
      ["employees", "Employees", "users"],
      ["houses", "Houses", "house"],
      ["clients", "Clients", "user"],
    ],
  },
  {
    title: "Operations",
    items: [
      ["roster", "Rosters & Attendance", "calendar"],
      ["leave", "Leave Management", "umbrella"],
    ],
  },
  {
    title: "Care Management",
    items: [
      ["documentation", "Care Documentation", "clipboard"],
      ["files", "Files & Galleries", "image"],
      ["notifications", "Notifications & Concerns", "bell"],
    ],
  },
  {
    title: "Administration",
    items: [
      ["reports", "Reports & Audit", "chart"],
      ["settings", "Settings", "settings"],
    ],
  },
]
export default function AdminShell({
  children,
  data,
}: {
  children: React.ReactNode
  data: StaffSnapshot
}) {
  const session = usePreviewSession()
  useEffect(() => {
    if (canManage(session.role) && !session.loaded) session.load(data)
  }, [session, data])
  const badges: Record<string, number> = {
    roster: session.data.attendanceCorrections.filter(
      (c) => c.status === "pending",
    ).length,
    documentation: session.data.corrections.filter(
      (c) => c.status === "pending",
    ).length,
    leave: session.data.leaveRequests.filter((l) => l.status === "pending")
      .length,
    notifications: session.data.concerns.filter((c) => c.status === "Submitted")
      .length,
  }
  const [collapsed, setCollapsed] = useState(false)
  const path = usePathname()
  const title =
    groups
      .flatMap((g) => g.items)
      .find(([page]) => path.startsWith(`/admin/${page}`))?.[1] ??
    "Administration"
  return (
    <>
      <div className="ad-desktop-guard">
        <span className="cm-logo">
          <Icon name="logo" />
        </span>
        <h2>Desktop required</h2>
        <p>
          CareMetrics Administration is available on desktop browsers. Please
          open this interface on a larger screen.
        </p>
        <Link className="cm-btn cm-btn--secondary cm-btn--md" href="/login">
          Back to sign in
        </Link>
      </div>
      <div className={`ad-app ${collapsed ? "ad-app--collapsed" : ""}`}>
        <aside className="ad-sidebar" aria-label="Administration navigation">
          <div className="ad-brand">
            <span className="cm-logo">
              <Icon name="logo" size={16} />
            </span>
            <div className="ad-lbl">
              <strong>CareMetrics</strong>
              <span>Administration</span>
            </div>
            <button
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Icon name="sidebar" size={16} />
            </button>
          </div>
          <nav className="ad-nav">
            {groups.map((g) => (
              <div key={g.title} className="ad-nav-group">
                <span className="ad-lbl ad-nav-title">{g.title}</span>
                {g.items.map(([page, label, icon]) => (
                  <Link
                    key={page}
                    href={`/admin/${page}`}
                    className={
                      path.startsWith(`/admin/${page}`) ? "active" : ""
                    }
                    aria-current={
                      path.startsWith(`/admin/${page}`) ? "page" : undefined
                    }
                    title={collapsed ? label : undefined}
                  >
                    <Icon name={icon} size={17} />
                    <span className="ad-lbl">{label}</span>
                    {canManage(session.role) &&
                      session.loaded &&
                      badges[page] > 0 && (
                        <b className="ad-lbl ad-nav-badge">{badges[page]}</b>
                      )}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
          <div className="ad-sidebar-foot ad-lbl">
            <Icon name="layers" size={13} />
            Prototype data · resets on reload
          </div>
        </aside>
        <div className="ad-main">
          <AdminHeader title={title} />
          <main className="ad-content">
            <div className="ad-page">
              <p className="cm-hint">
                UI ONLY · development preview · no authentication or persistence
              </p>
              {canManage(session.role) ? (
                !session.loaded && (
                  <p role="status">Loading shared development records…</p>
                )
              ) : (
                <>
                  <Locked text="Staff and Senior Staff cannot use Admin management screens or mutations." />
                  <p className="ad-faint">
                    Explicit development role demonstration · unavailable in
                    production.
                  </p>
                  <button
                    className="cm-btn cm-btn--primary cm-btn--md"
                    onClick={() => session.setRole("Administrator")}
                  >
                    Open Administrator preview
                  </button>
                </>
              )}
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  )
}
