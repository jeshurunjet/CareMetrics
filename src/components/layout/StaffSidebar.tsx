"use client"
import Icon from "@/components/Icon"
import Avatar from "@/modules/staff/ui/Avatar"
import type { Employee } from "@/modules/staff/data/types"
import { NAV } from "./staff-navigation"
export default function StaffSidebar({
  availablePages,
  user,
  unread,
  collapsed,
  section,
  onToggle,
  onLogout,
  top,
}: {
  availablePages?: readonly string[]
  user: Employee
  unread: number
  collapsed: boolean
  section: string
  onToggle: () => void
  onLogout: () => void
  top: (page: string) => void
}) {
  return (
    <aside className="cm-sidebar" aria-label="Main navigation">
      <div className="cm-sidebar-brand">
        <span className="cm-logo">
          <Icon name="logo" size={16} />
        </span>
        <span className="cm-sidebar-label cm-brand-name">CareMetrics</span>
        <button
          className="cm-collapse"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Icon name="sidebar" size={17} />
        </button>
      </div>

      <nav className="cm-sidebar-nav">
        {NAV.map((n) => (
          <button
            key={n.page}
            disabled={!!availablePages && !availablePages.includes(n.page)}
            className={section === n.page ? "active" : ""}
            onClick={() => top(n.page)}
            title={
              availablePages && !availablePages.includes(n.page)
                ? "Future Development"
                : collapsed
                  ? n.label
                  : undefined
            }
            aria-current={section === n.page ? "page" : undefined}
          >
            <Icon name={n.icon} size={18} />
            <span className="cm-sidebar-label">{n.label}</span>
            {n.page === "notifications" && unread > 0 && (
              <b className="cm-badge">{unread}</b>
            )}
          </button>
        ))}
      </nav>
      <div className="cm-sidebar-user">
        <Avatar name={user.name} size={34} photo={user.photo} />
        <div className="cm-sidebar-label">
          <strong>{user.name}</strong>
          <span>{user.role}</span>
        </div>
        <button
          className="cm-sidebar-label"
          onClick={onLogout}
          aria-label="Sign out"
          title="Sign out"
        >
          <Icon name="logout" size={16} />
        </button>
      </div>
    </aside>
  )
}
