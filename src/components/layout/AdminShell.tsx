"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import Icon from "@/components/Icon"
import Avatar from "@/components/Avatar"
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
}: {
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)
  const path = usePathname()
  const title =
    groups
      .flatMap((g) => g.items)
      .find(([page]) => path === `/admin/${page}`)?.[1] ?? "Administration"
  return (
    <>
      <div className="ad-desktop-guard">
        <span className="cm-logo">
          <Icon name="logo" />
        </span>
        <h1>Desktop required</h1>
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
                    className={path === `/admin/${page}` ? "active" : ""}
                    aria-current={
                      path === `/admin/${page}` ? "page" : undefined
                    }
                    title={collapsed ? label : undefined}
                  >
                    <Icon name={icon} size={17} />
                    <span className="ad-lbl">{label}</span>
                  </Link>
                ))}
              </div>
            ))}
          </nav>
          <div className="ad-sidebar-foot ad-lbl">
            <Icon name="layers" size={13} />
            UI ONLY · no live records
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
                disabled
                placeholder="Search employees, houses, clients, templates…"
                aria-label="Global search (not implemented)"
              />
            </div>
            <div className="ad-top-actions">
              <Avatar />
              <Link href="/login">Exit preview</Link>
            </div>
          </header>
          <main className="ad-content">
            <div className="ad-page">
              <p className="cm-hint">
                UI ONLY · development preview · no authentication or persistence
              </p>
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  )
}
