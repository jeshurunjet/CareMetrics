"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { Avatar, Icon, Btn } from "@/modules/staff/ui"
import { usePreviewSession, type PreviewRole } from "@/modules/preview/context"
import { canManage, dashboardSummary } from "../data/adapter"
export default function AdminHeader({ title }: { title: string }) {
  const router = useRouter()
  const session = usePreviewSession(),
    [menu, setMenu] = useState(false),
    [q, setQ] = useState("")
  const ref = useRef<HTMLDivElement>(null),
    account = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!menu) return
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(false)
        account.current?.focus()
      }
    }
    const outside = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setMenu(false)
    }
    window.addEventListener("keydown", close)
    window.addEventListener("click", outside)
    return () => {
      window.removeEventListener("keydown", close)
      window.removeEventListener("click", outside)
    }
  }, [menu])
  const s = session.data,
    term = q.trim().toLowerCase()
  const results =
    !canManage(session.role) || !session.loaded || term.length < 2
      ? []
      : [
          ...s.staff
            .filter((e) => `${e.name} ${e.email}`.toLowerCase().includes(term))
            .map((e) => ({ id: e.id, name: e.name, kind: "employees" })),
          ...s.houses
            .filter((h) =>
              `${h.name} ${h.address}`.toLowerCase().includes(term),
            )
            .map((h) => ({ id: h.id, name: h.name, kind: "houses" })),
          ...s.clients
            .filter((c) => `${c.name} ${c.ref}`.toLowerCase().includes(term))
            .map((c) => ({ id: c.id, name: c.name, kind: "clients" })),
        ].slice(0, 8)
  const accountName =
    s.staff.find(
      (e) =>
        e.id ===
        (session.role === "Administrator"
          ? "a1"
          : session.role === "Manager"
            ? "m1"
            : s.meId),
    )?.name ?? "Development account"
  const totals = dashboardSummary(s)
  const pending =
    totals.corrections +
    totals.leave +
    s.concerns.filter((c) => c.status === "Submitted").length
  return (
    <header className="ad-topbar">
      <div className="ad-top-title">
        <span>{title}</span>
      </div>
      <div className="ad-gsearch">
        <Icon name="search" size={16} />
        <input
          aria-label="Global search"
          placeholder="Search employees, houses, clients…"
          value={q}
          disabled={!canManage(session.role)}
          onChange={(e) => setQ(e.target.value)}
        />
        {term.length >= 2 && (
          <div className="ad-pop ad-pop--search" aria-label="Search results">
            {results.length ? (
              results.map((r) => (
                <Link
                  key={`${r.kind}-${r.id}`}
                  href={`/admin/${r.kind}/${r.id}`}
                  onClick={() => setQ("")}
                >
                  <strong>{r.name}</strong>
                  <span>{r.kind}</span>
                </Link>
              ))
            ) : (
              <p className="ad-pop-empty">No matches</p>
            )}
          </div>
        )}
      </div>
      <div className="ad-top-actions" ref={ref}>
        <Link
          className="ad-icon-btn"
          href="/admin/notifications"
          aria-label={`${pending} items need review`}
        >
          <Icon name="bell" size={18} />
          {canManage(session.role) && session.loaded && pending > 0 && (
            <b>{pending}</b>
          )}
        </Link>
        <button
          ref={account}
          className="ad-account"
          onClick={() => setMenu(!menu)}
          aria-expanded={menu}
          aria-controls="admin-account-menu"
        >
          <Avatar name={accountName} size={32} />
          <div>
            <strong>{accountName}</strong>
            <span>{session.role}</span>
          </div>
          <Icon name="down" size={14} />
        </button>
        {menu && (
          <div id="admin-account-menu" className="ad-pop ad-pop--account">
            <div className="ad-pop-head">Development preview only</div>
            <label className="ad-pop-label" htmlFor="admin-role-preview">
              Preview role · no trusted session
            </label>
            <select
              id="admin-role-preview"
              className="cm-input"
              value={session.role}
              onChange={(e) => session.setRole(e.target.value as PreviewRole)}
            >
              {["Administrator", "Manager", "Staff", "Senior Staff"].map(
                (role) => (
                  <option key={role}>{role}</option>
                ),
              )}
            </select>
            <Link href="/profile" onClick={() => setMenu(false)}>
              View Staff application
            </Link>
            <Link href="/admin/settings" onClick={() => setMenu(false)}>
              Settings
            </Link>
            <Btn
              variant="ghost"
              onClick={() => {
                session.reset()
                router.push("/login")
              }}
            >
              Exit preview
            </Btn>
          </div>
        )}
      </div>
    </header>
  )
}
