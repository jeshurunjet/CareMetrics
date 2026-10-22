"use client"
import StaffPageContainer from "./StaffPageContainer"
import StaffSidebar from "./StaffSidebar"
import StaffMobileHeader from "./StaffMobileHeader"
import StaffMobileNavigation from "./StaffMobileNavigation"
import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import Icon from "@/components/Icon"
import Avatar from "@/modules/staff/ui/Avatar"
import StaffDataProvider from "@/modules/staff/data/context"
import type { StaffSnapshot } from "@/modules/staff/data/types"
import { me, visibleNotices, myHouses } from "@/modules/staff/data/selectors"
import { clearMockSession } from "@/modules/auth/mock-session"
const SECTION: Record<string, string> = {
  house: "houses",
  client: "houses",
  "new-diary": "houses",
  "new-record": "houses",
}

export default function StaffShell({
  children,
  data,
}: {
  data: StaffSnapshot
  children: React.ReactNode
}) {
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
  const user = me(data)
  const unread = visibleNotices(data).filter((n) => !n.read).length
  const onLogout = () => {
    clearMockSession()
    router.push("/login")
  }
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
    <StaffDataProvider data={data}>
      <div className={`cm-app ${collapsed ? "cm-app--collapsed" : ""}`}>
        <StaffSidebar
          user={user}
          unread={unread}
          collapsed={collapsed}
          section={section}
          onToggle={() => setCollapsed((c) => !c)}
          onLogout={onLogout}
          top={top}
        />

        <div className="cm-main">
          <StaffMobileHeader unread={unread} top={top} />
          <main ref={main} className="cm-content" id="main">
            <StaffPageContainer>{children}</StaffPageContainer>
          </main>
          <StaffMobileNavigation
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
                <Avatar name={user.name} size={34} />
                <div>
                  <strong>{user.name}</strong>
                  <span>
                    {user.role} · {myHouses(data).length} houses
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
                  className="cm-drawer-item"
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
    </StaffDataProvider>
  )
}
