"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Avatar, Icon } from "@/modules/staff/ui"
import SignOut from "@/modules/auth/ui/SignOut"
const navigation = [
  ["dashboard", "Dashboard", "home"],
  ["employees", "Employees", "users"],
  ["houses", "Houses", "house"],
  ["clients", "Clients", "user"],
  ["roster", "Rosters & Attendance", "calendar"],
]
export default function AdminReadShell({
  name,
  children,
}: {
  name: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const title =
    navigation.find(([page]) => pathname.startsWith(`/admin/${page}`))?.[1] ||
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
        <Link className="cm-btn cm-btn--secondary cm-btn--md" href="/dashboard">
          Staff dashboard
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
            <div className="ad-nav-group">
              <span className="ad-lbl ad-nav-title">Main</span>
              {navigation.map(([page, label, icon]) => (
                <Link
                  key={page}
                  href={`/admin/${page}`}
                  className={
                    pathname.startsWith(`/admin/${page}`) ? "active" : ""
                  }
                  aria-current={
                    pathname.startsWith(`/admin/${page}`) ? "page" : undefined
                  }
                  title={collapsed ? label : undefined}
                >
                  <Icon name={icon} size={17} />
                  <span className="ad-lbl">{label}</span>
                </Link>
              ))}
            </div>
            <div className="ad-nav-group">
              <span className="ad-lbl ad-nav-title">Future Development</span>
              {[
                "Leave Management",
                "Templates & corrections",
                "Files & Galleries",
                "Notifications & Concerns",
                "Reports & Audit",
                "Settings",
              ].map((label) => (
                <button key={label} disabled title="Future Development">
                  <Icon name="lock" size={17} />
                  <span className="ad-lbl">{label}</span>
                </button>
              ))}
            </div>
          </nav>
          <div className="ad-sidebar-foot ad-lbl">
            <Icon name="layers" size={13} />
            Connected development data
          </div>
        </aside>
        <div className="ad-main">
          <header className="ad-topbar">
            <div className="ad-top-title">
              <span>{title}</span>
            </div>
            <div className="ad-gsearch">
              <Icon name="search" size={16} />
              <input
                aria-label="Global search unavailable"
                placeholder="Global search · future development"
                disabled
              />
            </div>
            <div className="ad-account">
              <Avatar name={name} size={30} />
              <span>{name}</span>
              <SignOut />
            </div>
          </header>
          <main className="ad-content">
            <div className="ad-page">
              <p className="cm-hint">
                CONNECTED DEVELOPMENT DATA · fictional records · core management
                connected
              </p>
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  )
}
