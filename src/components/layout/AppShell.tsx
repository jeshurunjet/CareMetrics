"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { Role } from "@/types/domain";

type NavItem = readonly [href: string, label: string, icon: string];
type NavSection = readonly [section: string, items: readonly NavItem[]];
const manager: readonly NavSection[] = [
  ["Overview", [["/dashboard", "Dashboard", "▦"]]],
  ["Workforce", [["/employees", "Employees", "♙"], ["/attendance", "Attendance", "◷"], ["/leave", "Leave", "☂"]]],
  ["Operations", [["/rostering", "Rostering", "□"], ["/houses", "Houses / Services", "⌂"]]],
  ["Clients & Care", [["/clients", "Clients", "♡"], ["/care-records", "Care Records", "▣"], ["/care-management", "Care Management", "▤"]]],
  ["Reporting", [["/reports", "Reports", "▥"], ["/notifications", "Notifications", "♢"]]],
  ["System", [["/administration", "Administration", "⚙"]]],
];
const employee: readonly NavSection[] = [["", [["/employee/dashboard", "Home", "▦"], ["/employee/roster", "My Roster", "□"], ["/employee/attendance", "My Timesheets", "◷"], ["/employee/leave", "My Leave", "☂"], ["/employee/clients", "My Clients", "♡"], ["/employee/notifications", "Notifications", "♢"], ["/employee/profile", "My Profile", "♙"]]]];

export default function AppShell({ role, children }: { role: Role; children: React.ReactNode }) {
  const path = usePathname(); const router = useRouter(); const [collapsed, setCollapsed] = useState(false);
  const nav = role === "manager" ? manager : employee; const name = role === "manager" ? "Admin Console" : "Jamie Taufa"; const initials = role === "manager" ? "AC" : "JT";
  const current = nav.flatMap((s) => s[1]).find(([href]) => path === href || (href !== "/dashboard" && path.startsWith(href + "/")));
  return <div className="app-shell">
    <aside className={collapsed ? "sidebar collapsed" : "sidebar"}>
      <div className="brand"><span className="brand-mark">⌁</span>{!collapsed && <strong>CareMetrics</strong>}<button onClick={() => setCollapsed(!collapsed)} aria-label="Toggle navigation">☰</button></div>
      <nav aria-label={`${role} navigation`}>{nav.map(([section, items]) => <div key={section || "employee"}>{section && !collapsed && <p className="nav-section">{section}</p>}{items.map(([href,label,icon]) => <Link key={href} href={href} title={collapsed ? label : undefined} className={path === href || (href !== "/dashboard" && path.startsWith(href + "/")) ? "nav-link active" : "nav-link"}><span aria-hidden>{icon}</span>{!collapsed && <span>{label}</span>}</Link>)}</div>)}</nav>
      <div className="user-card"><span className="avatar">{initials}</span>{!collapsed && <><span><strong>{name}</strong><small>{role === "manager" ? "Administrator" : "Support Worker"}</small></span><button onClick={() => router.push("/login")} aria-label="Sign out">↪</button></>}</div>
    </aside>
    <section className="app-main"><header className="topbar"><h1>{current?.[1] ?? "CareMetrics"}</h1><label className="global-search"><span>⌕</span><input aria-label="Global search" placeholder="Search…" /></label><Link href={role === "manager" ? "/notifications" : "/employee/notifications"} aria-label="Notifications">♢</Link><span className="avatar">{initials}</span></header><main>{children}</main></section>
  </div>;
}
