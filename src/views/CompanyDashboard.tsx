import { useState, Suspense } from 'react'
import dynamic from 'next/dynamic'

const ClockInMap = dynamic(() => import('../components/ClockInMap'), { ssr: false })

interface Props {
  onNavigate: (view: string) => void
}

const HOUSE_STAFF: Record<string, { name: string; time: string; status: 'on-site' | 'off-site' }[]> = {
  sunrise: [
    { name: 'Aroha Ngata', time: '07:02', status: 'on-site' },
    { name: 'Priya Sharma', time: '07:31', status: 'on-site' },
  ],
  oaklands: [
    { name: 'Lena Costa', time: '07:02', status: 'on-site' },
    { name: 'Marcus Bell', time: '07:05', status: 'on-site' },
  ],
  riverside: [
    { name: 'Jamie Taufa', time: '08:04', status: 'on-site' },
  ],
  cedar: [
    { name: 'Sam Wilson', time: '09:18', status: 'off-site' },
    { name: 'Daniel Park', time: '08:02', status: 'on-site' },
  ],
}

const HOUSE_NAMES: Record<string, string> = {
  sunrise: 'Sunrise House',
  oaklands: 'Oaklands Service',
  riverside: 'Riverside Lodge',
  cedar: 'Cedar Hill',
}

export default function CompanyDashboard({ onNavigate }: Props) {
  const [alertTab, setAlertTab] = useState<'care' | 'leave'>('care')
  const [selectedHouse, setSelectedHouse] = useState<string | null>(null)

  const stats = [
    { label: 'On Shift', value: '14', color: 'var(--color-brand)', bg: 'var(--color-brand-light)' },
    { label: 'Clients', value: '38', color: '#2a9d6f', bg: '#e6f7f1' },
    { label: 'Pending Leave', value: '6', color: '#d97706', bg: '#fff7e0' },
    { label: 'Care Alerts', value: '3', color: '#dc3545', bg: '#fce8e8' },
  ]

  const liveStaff = [
    { name: 'Aroha Ngata', house: 'Sunrise House', since: '07:00', status: 'clocked-in' },
    { name: 'Marcus Bell', house: 'Oaklands Service', since: '07:00', status: 'clocked-in' },
    { name: 'Jamie Taufa', house: 'Riverside Lodge', since: '08:00', status: 'clocked-in' },
    { name: 'Sam Wilson', house: 'Cedar Hill', since: '09:00', status: 'late' },
    { name: 'Lena Costa', house: 'Oaklands Service', since: '09:00', status: 'not-clocked' },
  ]

  const careAlerts = [
    { client: 'George Henare', house: 'Sunrise House', alert: 'Fluid balance below target — 3 days', severity: 'high' as const },
    { client: 'Margaret Liu', house: 'Oaklands Service', alert: 'Seizure recorded — incident form missing', severity: 'high' as const },
    { client: 'Robert Parata', house: 'Cedar Hill', alert: 'Weight check overdue by 7 days', severity: 'medium' as const },
  ]

  const leaveRequests = [
    { name: 'Marcus Bell', type: 'Annual Leave', dates: '18–22 Aug', days: 5 },
    { name: 'Priya Sharma', type: 'Sick Leave', dates: '14 Aug', days: 1 },
    { name: 'Sam Wilson', type: 'Annual Leave', dates: '1–5 Sep', days: 5 },
  ]

  const STATUS_STYLE: Record<string, { label: string; bg: string; color: string }> = {
    'clocked-in': { label: 'In', bg: '#e6f7f1', color: '#2a9d6f' },
    'late': { label: 'Late', bg: '#fff3e0', color: '#d97706' },
    'not-clocked': { label: 'Out', bg: '#fce8e8', color: '#dc3545' },
  }

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Date strip */}
      <div style={{ padding: '12px 16px 0', fontSize: 12, color: 'var(--color-ink-faint)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        Wed, 13 August 2026
      </div>

      {/* Stat grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '10px 16px' }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: s.color, opacity: 0.75, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: s.color, lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Clock-in location tracker */}
      <div style={{ margin: '4px 16px 0', background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink)' }}>Clock-in Location Tracker</span>
            <div style={{ display: 'flex', gap: 12, marginTop: 3 }}>
              <span style={{ fontSize: 11, color: '#2a9d6f', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2a9d6f', display: 'inline-block' }} />
                On-site: 6
              </span>
              <span style={{ fontSize: 11, color: '#dc3545', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc3545', display: 'inline-block' }} />
                Off-site: 1
              </span>
            </div>
          </div>
          {selectedHouse && (
            <button onClick={() => setSelectedHouse(null)} style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-brand)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              Reset view
            </button>
          )}
        </div>

        {/* Map */}
        <div style={{ height: 260, position: 'relative', background: '#e8ecef' }}>
          <Suspense fallback={<div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-ink-faint)', fontSize: 13 }}>Loading map…</div>}>
            <ClockInMap selectedHouse={selectedHouse} onSelectHouse={setSelectedHouse} />
          </Suspense>
          {/* Legend overlay */}
          <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 500, background: 'white', borderRadius: 8, padding: '7px 10px', boxShadow: '0 1px 6px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#2a9d6f', border: '2px solid white', boxShadow: '0 0 0 1px #2a9d6f' }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-ink-muted)' }}>Staff — on-site</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#dc3545', border: '2px solid white', boxShadow: '0 0 0 1px #dc3545' }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-ink-muted)' }}>Staff — off-site</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#1a6b7a', border: '2px solid white', boxShadow: '0 0 0 1px #1a6b7a' }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-ink-muted)' }}>House location</span>
            </div>
          </div>
        </div>

        {/* House selector tabs */}
        <div style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid var(--color-border)', scrollbarWidth: 'none' }}>
          {Object.entries(HOUSE_NAMES).map(([id, name]) => (
            <button key={id} onClick={() => setSelectedHouse(selectedHouse === id ? null : id)} style={{ flexShrink: 0, padding: '9px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, borderBottom: selectedHouse === id ? '2px solid var(--color-brand)' : '2px solid transparent', color: selectedHouse === id ? 'var(--color-brand)' : 'var(--color-ink-faint)', transition: 'all 0.13s', whiteSpace: 'nowrap' }}>
              {name.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Staff list for selected house (or summary) */}
        {selectedHouse ? (
          <div>
            {HOUSE_STAFF[selectedHouse].map((s, i, arr) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '11px 16px', gap: 10, borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                <Avatar name={s.name} size={30} />
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500, color: 'var(--color-ink)' }}>{s.name}</span>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-ink-faint)' }}>{s.time}</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: s.status === 'on-site' ? '#e6f7f1' : '#fce8e8', color: s.status === 'on-site' ? '#2a9d6f' : '#dc3545', flexShrink: 0 }}>
                  {s.status === 'on-site' ? '✓ On-site' : '⚠ Off-site'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '11px 16px', fontSize: 12.5, color: 'var(--color-ink-faint)', textAlign: 'center' }}>
            Tap a house tab or map pin to filter staff
          </div>
        )}
      </div>

      {/* Houses summary */}
      <div style={{ margin: '4px 16px', background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        <SectionHeader title="Houses" action="Manage" onAction={() => {}} />
        {[
          { name: 'Sunrise House', clients: 6, staff: 4, status: 'ok' },
          { name: 'Oaklands Service', clients: 8, staff: 6, status: 'alert' },
          { name: 'Riverside Lodge', clients: 5, staff: 3, status: 'ok' },
          { name: 'Cedar Hill', clients: 7, staff: 5, status: 'warning' },
        ].map((h, i, arr) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '13px 16px', borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: h.status === 'ok' ? '#2a9d6f' : h.status === 'warning' ? '#d97706' : '#dc3545', marginRight: 12, flexShrink: 0 }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-ink)', flex: 1 }}>{h.name}</span>
            <span style={{ fontSize: 12, color: 'var(--color-ink-faint)' }}>{h.staff} staff · {h.clients} clients</span>
          </div>
        ))}
      </div>

      {/* Live staff */}
      <div style={{ margin: '12px 16px 4px', background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        <SectionHeader title="Staff On Shift" action="View All" onAction={() => onNavigate('employees')} />
        {liveStaff.map((s, i) => {
          const st = STATUS_STYLE[s.status]
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: i < liveStaff.length - 1 ? '1px solid var(--color-border)' : 'none', gap: 12 }}>
              <Avatar name={s.name} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                <div style={{ fontSize: 12, color: 'var(--color-ink-faint)' }}>{s.house} · {s.since}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: st.bg, color: st.color, flexShrink: 0 }}>{st.label}</span>
            </div>
          )
        })}
      </div>

      {/* Alerts & Leave tabs */}
      <div style={{ margin: '12px 16px 4px', background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        {/* Tab row */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
          {(['care', 'leave'] as const).map(tab => (
            <button key={tab} onClick={() => setAlertTab(tab)} style={{ flex: 1, padding: '12px 8px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: alertTab === tab ? 'var(--color-brand)' : 'var(--color-ink-faint)', borderBottom: alertTab === tab ? '2px solid var(--color-brand)' : '2px solid transparent', transition: 'all 0.13s' }}>
              {tab === 'care' ? `Care Alerts (${careAlerts.length})` : `Leave (${leaveRequests.length})`}
            </button>
          ))}
        </div>

        {alertTab === 'care' && careAlerts.map((a, i) => (
          <div key={i} style={{ padding: '14px 16px', borderBottom: i < careAlerts.length - 1 ? '1px solid var(--color-border)' : 'none', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.severity === 'high' ? '#dc3545' : '#d97706', marginTop: 5, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)' }}>{a.client}</div>
              <div style={{ fontSize: 12, color: 'var(--color-ink-faint)', marginBottom: 3 }}>{a.house}</div>
              <div style={{ fontSize: 12.5, color: a.severity === 'high' ? '#dc3545' : '#d97706' }}>{a.alert}</div>
            </div>
            <button style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'none', fontSize: 12, fontWeight: 600, color: 'var(--color-brand)', cursor: 'pointer', flexShrink: 0 }}>View</button>
          </div>
        ))}

        {alertTab === 'leave' && leaveRequests.map((r, i) => (
          <div key={i} style={{ padding: '14px 16px', borderBottom: i < leaveRequests.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <Avatar name={r.name} size={34} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)' }}>{r.name}</div>
                <div style={{ fontSize: 12, color: 'var(--color-ink-faint)' }}>{r.type} · {r.dates} · {r.days}d</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: '#2a9d6f', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Approve</button>
              <button style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-ink-muted)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Decline</button>
            </div>
          </div>
        ))}
      </div>

      {/* Outstanding care */}
      <div style={{ margin: '12px 16px', background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        <SectionHeader title="Outstanding Records" action="View All" onAction={() => onNavigate('care')} />
        {[
          { client: 'George Henare', section: 'Fluid Balance', when: 'Today 08:00', overdue: true },
          { client: 'Peter Tumai', section: 'Sleep Monitoring', when: 'Yesterday', overdue: true },
          { client: 'Sarah Mitchell', section: 'Bowel Monitoring', when: 'Today 12:00', overdue: false },
        ].map((r, i, arr) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', gap: 10, borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.overdue ? '#dc3545' : '#d97706', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-ink)' }}>{r.client}</div>
              <div style={{ fontSize: 12, color: 'var(--color-ink-faint)' }}>{r.section}</div>
            </div>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: r.overdue ? '#dc3545' : '#d97706' }}>{r.when}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SectionHeader({ title, action, onAction }: { title: string; action: string; onAction: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: '1px solid var(--color-border)' }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink)', letterSpacing: '0.01em' }}>{title}</span>
      <button onClick={onAction} style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-brand)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{action} →</button>
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
