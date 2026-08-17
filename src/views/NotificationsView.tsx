import { useState } from 'react'

type Severity = 'danger' | 'warning' | 'info' | 'success'

interface Notification {
  id: number
  title: string
  body: string
  time: string
  read: boolean
  severity: Severity
  link?: string
  category: string
}

const INITIAL: Notification[] = [
  { id: 1, title: 'Attendance Exception — Sam Wilson', body: 'Sam Wilson clocked in 18 minutes late for their 09:00 shift at Cedar Hill. Review required.', time: '08 min ago', read: false, severity: 'warning', category: 'Attendance', link: 'attendance' },
  { id: 2, title: 'No Clock-in Recorded — Lena Costa', body: 'Lena Costa has not clocked in for their scheduled 10:00 shift at Oaklands Service.', time: '14 min ago', read: false, severity: 'danger', category: 'Attendance', link: 'attendance' },
  { id: 3, title: 'Leave Request — Marcus Bell', body: 'Marcus Bell has submitted an annual leave request for 24–28 August 2026. Approval required.', time: '1 hr ago', read: false, severity: 'info', category: 'Leave', link: 'leave' },
  { id: 4, title: 'Care Record Overdue — Peter Tumai', body: "A care record for Peter Tumai's morning routine has not been submitted. It was due at 09:30.", time: '2 hr ago', read: false, severity: 'warning', category: 'Care', link: 'care-records' },
  { id: 5, title: 'Shift Unassigned — Cedar Hill', body: 'The 15:00–23:00 shift on 19 August at Cedar Hill has no assigned support worker.', time: '3 hr ago', read: true, severity: 'warning', category: 'Rostering', link: 'rostering' },
  { id: 6, title: 'Leave Approved — Aroha Ngata', body: 'Your leave request for 20–21 August has been approved by Priya Sharma.', time: 'Yesterday', read: true, severity: 'success', category: 'Leave' },
  { id: 7, title: 'New Employee Added', body: 'Grace Tūhoe has been added to Riverside Lodge as a Support Worker.', time: 'Yesterday', read: true, severity: 'info', category: 'Employees', link: 'employees' },
  { id: 8, title: 'Care Template Updated', body: "The 'Personal Care' template has been updated to version 3. Existing historical records are unaffected.", time: '2 days ago', read: true, severity: 'info', category: 'Care', link: 'care-management' },
]

const SEVERITY_STYLE: Record<Severity, { icon: string; bg: string; color: string; border: string }> = {
  danger: { icon: '✕', bg: '#fce8e8', color: '#dc3545', border: 'rgba(220,53,69,0.15)' },
  warning: { icon: '⚠', bg: '#fff7e0', color: '#d97706', border: 'rgba(217,119,6,0.15)' },
  info: { icon: 'ℹ', bg: '#e6f0fd', color: '#3b82f6', border: 'rgba(59,130,246,0.15)' },
  success: { icon: '✓', bg: '#e6f7f1', color: '#2a9d6f', border: 'rgba(42,157,111,0.15)' },
}

export default function NotificationsView() {
  const [notifications, setNotifications] = useState(INITIAL)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [category, setCategory] = useState('All')

  const categories = ['All', ...Array.from(new Set(INITIAL.map(n => n.category)))]
  const unreadCount = notifications.filter(n => !n.read).length

  const visible = notifications.filter(n =>
    (filter === 'all' || !n.read) &&
    (category === 'All' || n.category === category)
  )

  function markRead(id: number) {
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n))
  }

  function markAllRead() {
    setNotifications(ns => ns.map(n => ({ ...n, read: true })))
  }

  return (
    <div style={{ padding: 32, maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, margin: '0 0 4px', color: 'var(--color-ink)' }}>Notifications</h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--color-ink-faint)' }}>{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} style={{ padding: '8px 16px', borderRadius: 9, border: '1.5px solid var(--color-border)', background: 'white', color: 'var(--color-ink)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            Mark all read
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 2, background: 'white', borderRadius: 9, padding: 3, border: '1px solid var(--color-border)' }}>
          {(['all', 'unread'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: filter === f ? 700 : 400, background: filter === f ? 'var(--color-brand)' : 'transparent', color: filter === f ? 'white' : 'var(--color-ink-muted)', textTransform: 'capitalize' }}>
              {f}
            </button>
          ))}
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)} style={{ padding: '8px 12px', borderRadius: 9, border: '1.5px solid var(--color-border)', fontSize: 13, color: 'var(--color-ink)', outline: 'none', background: 'white', cursor: 'pointer' }}>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🎉</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-ink)', marginBottom: 6 }}>You're all caught up</div>
          <p style={{ fontSize: 14, color: 'var(--color-ink-faint)', margin: 0 }}>No notifications match the current filter.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {visible.map(n => {
            const s = SEVERITY_STYLE[n.severity]
            return (
              <div key={n.id} onClick={() => markRead(n.id)} style={{ background: n.read ? 'white' : '#fafcff', borderRadius: 12, border: `1px solid ${n.read ? 'var(--color-border)' : s.border}`, padding: '16px 18px', cursor: 'pointer', display: 'flex', gap: 14, alignItems: 'flex-start', transition: 'box-shadow 0.12s' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
              >
                <div style={{ width: 32, height: 32, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: s.color, flexShrink: 0, fontWeight: 700 }}>{s.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 14, fontWeight: n.read ? 600 : 700, color: 'var(--color-ink)', flex: 1 }}>{n.title}</span>
                    {!n.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-brand)', flexShrink: 0, marginTop: 4 }} />}
                  </div>
                  <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--color-ink-muted)', lineHeight: 1.5 }}>{n.body}</p>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'var(--color-surface)', color: 'var(--color-ink-faint)' }}>{n.category}</span>
                    <span style={{ fontSize: 11, color: 'var(--color-ink-faint)' }}>{n.time}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
