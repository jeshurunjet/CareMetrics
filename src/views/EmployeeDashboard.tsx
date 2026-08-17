import { useState, lazy, Suspense } from 'react'

const MyLocationMap = lazy(() => import('../components/MyLocationMap'))

export default function EmployeeDashboard({ onNavigate }: { onNavigate?: (v: string) => void }) {
  const [clockedIn, setClockedIn] = useState(false)
  const [clockTime, setClockTime] = useState<string | null>(null)

  function handleClock() {
    if (!clockedIn) {
      const now = new Date()
      setClockTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`)
    }
    setClockedIn(c => !c)
  }

  const tasks = [
    { time: '08:00', task: 'Morning handover', done: clockedIn },
    { time: '08:30', task: 'Assist George H. with morning routine', done: false },
    { time: '09:00', task: 'Medication — Pete T.', done: false },
    { time: '10:00', task: 'Morning activities / community outing', done: false },
    { time: '12:00', task: 'Lunch + fluid balance record', done: false },
    { time: '15:00', task: 'Afternoon handover documentation', done: false },
  ]

  return (
    <div style={{ padding: '24px 32px', maxWidth: 900 }}>
      {/* Greeting */}
      <div style={{ marginBottom: 8 }}>
        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--color-ink-faint)', margin: '0 0 2px' }}>Wednesday, 13 August</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400, margin: 0, color: 'var(--color-ink)' }}>Good morning, Jamie</h1>
      </div>

      {/* Clock in card */}
      <div style={{ margin: '8px 0', borderRadius: 16, padding: '20px', background: clockedIn ? 'linear-gradient(135deg, #1a6b7a, #2d8fa0)' : 'white', border: clockedIn ? 'none' : '1px solid var(--color-border)', transition: 'all 0.3s' }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: clockedIn ? 'rgba(255,255,255,0.6)' : 'var(--color-ink-faint)', marginBottom: 3 }}>Current Shift</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: clockedIn ? 'white' : 'var(--color-ink)' }}>Riverside Lodge</div>
          <div style={{ fontSize: 13, color: clockedIn ? 'rgba(255,255,255,0.7)' : 'var(--color-ink-muted)', marginTop: 2 }}>
            08:00 – 16:00 · {clockedIn ? `Clocked in at ${clockTime}` : 'Not yet clocked in'}
          </div>
        </div>
        <button onClick={handleClock} style={{ width: '100%', padding: '14px', borderRadius: 12, border: clockedIn ? '1.5px solid rgba(255,255,255,0.3)' : 'none', background: clockedIn ? 'rgba(255,255,255,0.15)' : 'var(--color-brand)', color: 'white', cursor: 'pointer', fontSize: 15, fontWeight: 700, letterSpacing: '0.01em' }}>
          {clockedIn ? '⏹  Clock Out' : '▶  Clock In Now'}
        </button>
      </div>

      {/* My location map */}
      <div style={{ margin: '0 0 12px', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--color-border)', background: '#e8ecef' }}>
        {/* Map header */}
        <div style={{ background: 'white', padding: '11px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: clockedIn ? '#2a9d6f' : '#94a3b8' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink)' }}>My Location</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--color-ink-faint)' }}>Riverside Lodge</span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: clockedIn ? '#e6f7f1' : 'var(--color-surface)', color: clockedIn ? '#2a9d6f' : 'var(--color-ink-faint)' }}>
              {clockedIn ? '✓ On-site' : 'Not clocked in'}
            </span>
          </div>
        </div>
        {/* Map */}
        <div style={{ height: 210, position: 'relative' }}>
          <Suspense fallback={<div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--color-ink-faint)' }}>Loading map…</div>}>
            <MyLocationMap clockedIn={clockedIn} />
          </Suspense>
          {/* Legend */}
          <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 500, background: 'white', borderRadius: 8, padding: '7px 10px', boxShadow: '0 1px 6px rgba(0,0,0,0.13)', display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: clockedIn ? '#2a9d6f' : '#94a3b8', border: '2px solid white', boxShadow: '0 0 0 1px rgba(0,0,0,0.1)' }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-ink-muted)' }}>You</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 9, height: 9, borderRadius: 2, background: '#1a6b7a', transform: 'rotate(45deg)', border: '1.5px solid white', boxShadow: '0 0 0 1px rgba(0,0,0,0.1)' }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-ink-muted)' }}>House</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alert */}
      <div style={{ margin: '0 0 12px', background: '#fce8e8', borderRadius: 14, padding: '14px 16px', border: '1px solid rgba(220,53,69,0.15)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#dc3545', marginBottom: 5 }}>⚠ Client Alert</div>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--color-ink)', lineHeight: 1.5 }}>
          <strong>Peter Tumai</strong> — Only 5h 20min sleep last night. Monitor for fatigue and report any concerns to your supervisor.
        </p>
      </div>

      {/* Today's tasks */}
      <div style={{ margin: '0 0 12px', background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--color-border)' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink)' }}>Today's Schedule</span>
        </div>
        {tasks.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < tasks.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-faint)', width: 40, flexShrink: 0 }}>{item.time}</span>
            <span style={{ fontSize: 13.5, color: item.done ? 'var(--color-ink-faint)' : 'var(--color-ink)', textDecoration: item.done ? 'line-through' : 'none', flex: 1 }}>{item.task}</span>
            {item.done && <span style={{ color: '#2a9d6f', fontSize: 16, flexShrink: 0 }}>✓</span>}
          </div>
        ))}
      </div>

      {/* Assigned clients */}
      <div style={{ margin: '0 0 12px', background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--color-border)' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink)' }}>My Clients Today</span>
        </div>
        {[
          { name: 'Peter Tumai', note: 'Mobility support required', alert: true },
          { name: 'Grace Williams', note: 'PEG feed at 08:00 and 12:00', alert: false },
          { name: 'Tom Ngatai', note: 'Community outing this afternoon', alert: false },
        ].map((c, i, arr) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
            <Avatar name={c.name} size={36} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)' }}>{c.name}</div>
              <div style={{ fontSize: 12, color: 'var(--color-ink-faint)' }}>{c.note}</div>
            </div>
            {c.alert && <span style={{ fontSize: 18 }}>⚠️</span>}
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ margin: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { label: 'New Diary Entry', icon: '📝', color: 'var(--color-brand)', bg: 'var(--color-brand-light)', nav: 'clients' },
          { label: 'Record Care', icon: '🩺', color: '#2a9d6f', bg: '#e6f7f1', nav: 'clients' },
          { label: 'Request Leave', icon: '🌂', color: '#d97706', bg: '#fff7e0', nav: 'my-leave' },
          { label: 'My Profile', icon: '👤', color: '#7c3aed', bg: '#f5f0ff', nav: 'my-profile' },
        ].map((a, i) => (
          <button key={i} onClick={() => onNavigate?.(a.nav)} style={{ padding: '16px 12px', borderRadius: 14, border: 'none', background: a.bg, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
            <span style={{ fontSize: 22 }}>{a.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: a.color }}>{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2)
  const hue = name.charCodeAt(0) * 7 % 360
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `hsl(${hue}, 45%, 55%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, color: 'white', flexShrink: 0 }}>
      {initials}
    </div>
  )
}
