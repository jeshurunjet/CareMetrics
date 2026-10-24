"use client"
import Icon from "@/components/Icon"
import { MOBILE } from "./staff-navigation"
export default function StaffMobileNavigation({
  availablePages,
  section,
  drawer,
  top,
  onOpenMenu,
}: {
  availablePages?: readonly string[]
  section: string
  drawer: boolean
  top: (page: string) => void
  onOpenMenu: () => void
}) {
  return (
    <nav className="cm-bottom-nav" aria-label="Primary">
      {MOBILE.map((n) => (
        <button
          key={n.page}
          disabled={!!availablePages && !availablePages.includes(n.page)}
          title={
            availablePages && !availablePages.includes(n.page)
              ? "Future Development"
              : undefined
          }
          className={section === n.page ? "active" : ""}
          onClick={() => top(n.page)}
          aria-current={section === n.page ? "page" : undefined}
        >
          <Icon name={n.icon} size={21} />
          <span>{n.label}</span>
        </button>
      ))}
      <button
        className={
          drawer ||
          ["leave", "notifications", "profile", "settings", "clock"].includes(
            section,
          )
            ? "active"
            : ""
        }
        onClick={onOpenMenu}
      >
        <Icon name="menu" size={21} />
        <span>Menu</span>
      </button>
    </nav>
  )
}
