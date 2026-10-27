"use client"
import type { Employee } from "@/modules/staff/data/types"
import StaffPageContainer from "./StaffPageContainer"
import StaffSidebar from "./StaffSidebar"
import StaffMobileHeader from "./StaffMobileHeader"
import StaffMobileNavigation from "./StaffMobileNavigation"
import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import Icon from "@/components/Icon"
import Avatar from "@/modules/staff/ui/Avatar"
import { useStaffData } from "@/modules/staff/data/context"
import { usePreviewSession } from "@/modules/preview/context"
import { me, myHouses } from "@/modules/staff/data/selectors"
import { clearMockSession } from "@/modules/auth/mock-session"
import { unreadCount } from "@/modules/staff/notifications/adapter"
const SECTION: Record<string, string> = {
  house: "houses",
  client: "houses",
  "new-diary": "houses",
  "new-record": "houses",
}

export default function StaffShell({
  children,
}: {
  children: React.ReactNode
}) {
  const data = useStaffData()
  const preview = usePreviewSession()
  const router = useRouter()
  return (
    <StaffShellView
      user={me(data)}
      houseCount={myHouses(data).length}
      unread={unreadCount(data)}
      onLogout={() => {
        clearMockSession()
        preview.reset()
        router.push("/login")
      }}
    >
      {children}
    </StaffShellView>
  )
}
export function StaffShellView({
  children,
  user,
  houseCount,
  unread,
  onLogout,
  backend = false,
  fictionalDemo = false,
}: {
  children: React.ReactNode
  user: Employee
  houseCount: number
  unread: number
  onLogout: () => void
  backend?: boolean
  fictionalDemo?: boolean
}) {
  const availablePages = backend
    ? ["home", "clock", "houses", "search", "profile", "settings", "roster"]
    : undefined
  const router = useRouter()
  const path = usePathname()
  const query = useSearchParams().toString()
  const [collapsed, setCollapsed] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const main = useRef<HTMLDivElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)
  const page =
    path === "/shift-check"
      ? "clock"
      : path === "/dashboard"
        ? "home"
        : path.split("/")[1]
  const section = page === "clients" ? "houses" : (SECTION[page] ?? page)
  const top = (page: string) => {
    setDrawer(false)
    router.push(
      page === "clock"
        ? "/shift-check"
        : page === "home"
          ? "/dashboard"
          : `/${page}`,
    )
  }
  useEffect(() => {
    if (window.location.hash) {
      document
        .getElementById(decodeURIComponent(window.location.hash.slice(1)))
        ?.scrollIntoView({ block: "start" })
    } else main.current?.scrollTo(0, 0)
  }, [path, query])
  useEffect(() => {
    if (!drawer) return
    const previous = document.activeElement as HTMLElement | null
    const el = drawerRef.current
    el?.querySelector<HTMLButtonElement>("button")?.focus()
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawer(false)
      if (e.key === "Tab" && el) {
        const items = Array.from(
          el.querySelectorAll<HTMLButtonElement>("button"),
        )
        const first = items[0],
          last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }
    window.addEventListener("keydown", key)
    return () => {
      window.removeEventListener("keydown", key)
      previous?.focus()
    }
  }, [drawer])
  return (
    <>
      <div className={`cm-app ${collapsed ? "cm-app--collapsed" : ""}`}>
        <StaffSidebar
          availablePages={availablePages}
          user={user}
          unread={unread}
          collapsed={collapsed}
          section={section}
          onToggle={() => setCollapsed((c) => !c)}
          onLogout={onLogout}
          top={top}
        />

        <div className="cm-main">
          <StaffMobileHeader
            unread={unread}
            top={top}
            notificationsAvailable={!backend}
          />
          <main ref={main} className="cm-content" id="main">
            <StaffPageContainer backend={backend} fictionalDemo={fictionalDemo}>
              {children}
            </StaffPageContainer>
          </main>
          <StaffMobileNavigation
            availablePages={availablePages}
            section={section}
            drawer={drawer}
            top={top}
            onOpenMenu={() => setDrawer(true)}
          />
        </div>

        {drawer && (
          <div className="cm-drawer-layer">
            <button
              className="cm-modal-backdrop"
              onClick={() => setDrawer(false)}
              aria-label="Close menu"
              tabIndex={-1}
            />
            <div
              className="cm-drawer"
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
            >
              <div className="cm-drawer-handle" />
              <div className="cm-drawer-user">
                <Avatar name={user.name} size={34} photo={user.photo} />
                <div>
                  <strong>{user.name}</strong>
                  <span>
                    {user.role} · {houseCount} houses
                  </span>
                </div>
              </div>
              {[
                { page: "clock", label: "Clock-in / My Shifts", icon: "clock" },
                { page: "notifications", label: "Notifications", icon: "bell" },
                { page: "leave", label: "Leave", icon: "umbrella" },
                { page: "profile", label: "My Profile", icon: "user" },
                { page: "settings", label: "Settings", icon: "settings" },
              ].map((n) => (
                <button
                  key={n.page}
                  disabled={
                    !!availablePages && !availablePages.includes(n.page)
                  }
                  title={
                    availablePages && !availablePages.includes(n.page)
                      ? "Future Development"
                      : undefined
                  }
                  className="cm-drawer-item"
                  aria-current={section === n.page ? "page" : undefined}
                  onClick={() => top(n.page)}
                >
                  <span>
                    <Icon name={n.icon} size={19} />
                  </span>
                  {n.label}
                  {n.page === "notifications" && unread > 0 && (
                    <b className="cm-badge">{unread}</b>
                  )}
                  <Icon name="chevron" size={16} />
                </button>
              ))}
              <button
                className="cm-drawer-item cm-drawer-item--danger"
                onClick={onLogout}
              >
                <span>
                  <Icon name="logout" size={19} />
                </span>
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
