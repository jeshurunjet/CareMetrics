import { useState } from 'react'
import LoginView from './views/LoginView'
import CompanyDashboard from './views/CompanyDashboard'
import EmployeeDashboard from './views/EmployeeDashboard'
import EmployeesView from './views/EmployeesView'
import RosteringView from './views/RosteringView'
import LeaveManagementView from './views/LeaveManagementView'
import ClientsView from './views/ClientsView'
import CareRecordsView from './views/CareRecordsView'
import CareManagementView from './views/CareManagementView'
import ReportsView from './views/ReportsView'
import HousesView from './views/HousesView'
import AttendanceView from './views/AttendanceView'
import AdministrationView from './views/AdministrationView'
import NotificationsView from './views/NotificationsView'
import MyRosterView from './views/MyRosterView'
import MyLeaveView from './views/MyLeaveView'
import MyAttendanceView from './views/MyAttendanceView'
import MyProfileView from './views/MyProfileView'

export type Role = 'manager' | 'employee'

interface AuthUser {
  name: string
  role: Role
  house?: string
  avatar: string
}

const DEMO_USERS: Record<string, AuthUser> = {
  manager: { name: 'Admin Console', role: 'manager', avatar: 'AC' },
  employee: { name: 'Jamie Taufa', role: 'employee', house: 'Riverside Lodge', avatar: 'JT' },
}

const MANAGER_NAV = [
  { section: 'Overview', items: [{ id: 'dashboard', label: 'Dashboard', icon: IconGrid }] },
  {
    section: 'Workforce', items: [
      { id: 'employees', label: 'Employees', icon: IconUsers },
      { id: 'attendance', label: 'Attendance', icon: IconClock },
      { id: 'leave', label: 'Leave', icon: IconUmbrella },
    ]
  },
  { section: 'Operations', items: [
    { id: 'rostering', label: 'Rostering', icon: IconCalendar },
    { id: 'houses', label: 'Houses / Services', icon: IconHome },
  ]},
  { section: 'Clients & Care', items: [
    { id: 'clients', label: 'Clients', icon: IconHeart },
    { id: 'care-records', label: 'Care Records', icon: IconClipboard },
    { id: 'care-management', label: 'Care Management', icon: IconTemplate },
  ]},
  { section: 'Reporting', items: [
    { id: 'reports', label: 'Reports', icon: IconChart },
    { id: 'notifications', label: 'Notifications', icon: IconBell, badge: 4 },
  ]},
  { section: 'System', items: [
    { id: 'administration', label: 'Administration', icon: IconSettings },
  ]},
]

const EMPLOYEE_NAV = [
  { section: '', items: [
    { id: 'emp-dashboard', label: 'Home', icon: IconGrid },
    { id: 'my-roster', label: 'My Roster', icon: IconCalendar },
    { id: 'my-attendance', label: 'My Timesheets', icon: IconClock },
    { id: 'my-leave', label: 'My Leave', icon: IconUmbrella },
    { id: 'clients', label: 'My Clients', icon: IconHeart },
    { id: 'notifications', label: 'Notifications', icon: IconBell, badge: 2 },
    { id: 'my-profile', label: 'My Profile', icon: IconUser },
  ]},
]

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [activeView, setActiveView] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  function login(role: Role) {
    const u = DEMO_USERS[role]
    setUser(u)
    setActiveView(role === 'manager' ? 'dashboard' : 'emp-dashboard')
  }

  function logout() {
    setUser(null)
    setActiveView('dashboard')
  }

  if (!user) return <LoginView onLogin={login} />

  const nav = user.role === 'manager' ? MANAGER_NAV : EMPLOYEE_NAV
  const allItems = nav.flatMap(s => s.items)
  const currentItem = allItems.find(i => i.id === activeView)

  function renderView() {
    switch (activeView) {
      case 'dashboard': return <CompanyDashboard onNavigate={setActiveView} />
      case 'employees': return <EmployeesView />
      case 'attendance': return <AttendanceView />
      case 'leave': return <LeaveManagementView />
      case 'rostering': return <RosteringView />
      case 'houses': return <HousesView />
      case 'clients': return <ClientsView />
      case 'care-records': return <CareRecordsView />
      case 'care-management': return <CareManagementView />
      case 'reports': return <ReportsView />
      case 'notifications': return <NotificationsView />
      case 'administration': return <AdministrationView />
      case 'emp-dashboard': return <EmployeeDashboard onNavigate={setActiveView} />
      case 'my-roster': return <MyRosterView />
      case 'my-attendance': return <MyAttendanceView />
      case 'my-leave': return <MyLeaveView />
      case 'my-profile': return <MyProfileView />
      default: return <CompanyDashboard onNavigate={setActiveView} />
    }
  }

  const W = sidebarCollapsed ? 60 : 224

  return (
    <div style={{ display: 'flex', height: '100dvh', background: 'var(--color-surface)', fontFamily: 'var(--font-sans)', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{ width: W, minWidth: W, background: '#0f1e2a', display: 'flex', flexDirection: 'column', transition: 'width 0.2s ease, min-width 0.2s ease', overflow: 'hidden', zIndex: 30 }}>
        {/* Logo */}
        <div style={{ padding: sidebarCollapsed ? '16px 12px' : '16px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: 'var(--color-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          {!sidebarCollapsed && <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'white', letterSpacing: '-0.01em', flex: 1, whiteSpace: 'nowrap' }}>CareMetrics</span>}
          <button onClick={() => setSidebarCollapsed(c => !c)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 2, flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 0' }}>
          {nav.map((section, si) => (
            <div key={si}>
              {section.section && !sidebarCollapsed && (
                <div style={{ padding: '10px 14px 3px', fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
                  {section.section}
                </div>
              )}
              {section.items.map(item => {
                const active = activeView === item.id
                return (
                  <button key={item.id} onClick={() => setActiveView(item.id)} title={sidebarCollapsed ? item.label : undefined} style={{ display: 'flex', alignItems: 'center', gap: 10, width: 'calc(100% - 12px)', padding: sidebarCollapsed ? '9px 0' : '8px 12px', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', border: 'none', cursor: 'pointer', textAlign: 'left', borderRadius: 6, margin: '1px 6px', background: active ? 'var(--color-brand)' : 'transparent', color: active ? 'white' : 'rgba(255,255,255,0.5)', fontWeight: active ? 600 : 400, fontSize: 13, transition: 'all 0.12s', whiteSpace: 'nowrap', position: 'relative' } as React.CSSProperties}
                    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.85)' }}
                    onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)' } }}
                  >
                    <item.icon size={15} />
                    {!sidebarCollapsed && <span style={{ flex: 1 }}>{item.label}</span>}
                    {!sidebarCollapsed && (item as { badge?: number }).badge && (
                      <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--color-accent)', color: 'white', borderRadius: 10, padding: '1px 6px', marginLeft: 4 }}>{(item as { badge?: number }).badge}</span>
                    )}
                  </button>
                )
              })}
              {si < nav.length - 1 && section.section && !sidebarCollapsed && (
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '6px 12px' }} />
              )}
            </div>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: sidebarCollapsed ? '10px 0' : '10px 12px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 10, justifyContent: sidebarCollapsed ? 'center' : 'flex-start', flexShrink: 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #2d8fa0, #1a6b7a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0, cursor: 'pointer' }} onClick={() => setActiveView(user.role === 'employee' ? 'my-profile' : 'administration')}>
            {user.avatar}
          </div>
          {!sidebarCollapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', marginTop: 1 }}>{user.role === 'manager' ? 'Administrator' : 'Support Worker'}</div>
            </div>
          )}
          {!sidebarCollapsed && (
            <button onClick={logout} title="Sign out" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 3, flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <header style={{ height: 52, background: 'white', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, flexShrink: 0, zIndex: 20 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400, color: 'var(--color-ink)', flex: 1 }}>{currentItem?.label ?? 'CareMetrics'}</span>
          {/* Global search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '6px 12px', width: 260 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-faint)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input placeholder="Search…" style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: 'var(--color-ink)', width: '100%' }} />
          </div>
          {/* Notifications */}
          <button onClick={() => setActiveView('notifications')} style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-muted)', padding: 6, borderRadius: 6 }}>
            <IconBell size={18} />
            <span style={{ position: 'absolute', top: 4, right: 4, width: 7, height: 7, borderRadius: '50%', background: 'var(--color-accent)', border: '1.5px solid white' }} />
          </button>
          {/* Avatar */}
          <button onClick={() => setActiveView(user.role === 'employee' ? 'my-profile' : 'administration')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #2d8fa0, #1a6b7a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white' }}>{user.avatar}</div>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-ink)' }}>{user.name}</span>
          </button>
        </header>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {renderView()}
        </div>
      </div>
    </div>
  )
}

// Icons
function IconGrid({ size = 16 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> }
function IconUsers({ size = 16 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> }
function IconCalendar({ size = 16 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> }
function IconUmbrella({ size = 16 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 12a11.05 11.05 0 0 0-22 0zm-5 7a3 3 0 0 1-6 0v-7"/></svg> }
function IconHeart({ size = 16 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> }
function IconClipboard({ size = 16 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg> }
function IconChart({ size = 16 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> }
function IconHome({ size = 16 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> }
function IconClock({ size = 16 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> }
function IconSettings({ size = 16 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/><path d="M19.07 4.93A10 10 0 0 0 4.93 4.93"/></svg> }
function IconBell({ size = 16 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> }
function IconTemplate({ size = 16 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg> }
function IconUser({ size = 16 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> }
