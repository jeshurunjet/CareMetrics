import { useState, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { STAFF_LOCATIONS } from '../data/staffLocations'

const StaffLocationMap = dynamic(() => import('../components/StaffLocationMap'), { ssr: false })

const HOUSES = ['Sunrise House', 'Oaklands Service', 'Riverside Lodge', 'Cedar Hill']

const EMPLOYEES = [
  { name: 'Aroha Ngata', role: 'Senior Support Worker', house: 'Sunrise House', status: 'active', shift: '07:00–15:00', clocked: '07:02', phone: '021 234 567' },
  { name: 'Marcus Bell', role: 'Support Worker', house: 'Oaklands Service', status: 'on-leave', shift: 'On Leave', clocked: '—', phone: '021 345 678' },
  { name: 'Jamie Taufa', role: 'Support Worker', house: 'Riverside Lodge', status: 'active', shift: '08:00–16:00', clocked: '08:04', phone: '021 456 789' },
  { name: 'Priya Sharma', role: 'Team Leader', house: 'Sunrise House', status: 'active', shift: '07:30–15:30', clocked: '07:31', phone: '021 567 890' },
  { name: 'Sam Wilson', role: 'Support Worker', house: 'Cedar Hill', status: 'late', shift: '09:00–17:00', clocked: '09:18', phone: '021 678 901' },
  { name: 'Lena Costa', role: 'Support Worker', house: 'Oaklands Service', status: 'off-shift', shift: 'Off Shift', clocked: '—', phone: '021 789 012' },
  { name: 'Daniel Park', role: 'House Manager', house: 'Cedar Hill', status: 'active', shift: '08:00–16:00', clocked: '08:02', phone: '021 890 123' },
  { name: "Grace Tūhoe", role: 'Support Worker', house: 'Riverside Lodge', status: 'active', shift: '15:00–23:00', clocked: '—', phone: '021 901 234' },
]

const STATUS_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  active: { label: 'Active', bg: '#e6f7f1', color: '#2a9d6f' },
  'on-leave': { label: 'On Leave', bg: '#e6f0fd', color: '#3b82f6' },
  late: { label: 'Late', bg: '#fff3e0', color: '#d97706' },
  'off-shift': { label: 'Off Shift', bg: 'var(--color-surface)', color: 'var(--color-ink-faint)' },
}

export default function EmployeesView() {
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [lateComment, setLateComment] = useState('')
  const [locationOverride, setLocationOverride] = useState('')
  const [savedComment, setSavedComment] = useState<Record<string, string>>({})
  const [savedLocation, setSavedLocation] = useState<Record<string, string>>({})

  const selected = EMPLOYEES.find(e => e.name === selectedName) ?? null
  const staffLoc = STAFF_LOCATIONS.find(s => s.name === selectedName)
  const isOffSite = staffLoc?.status === 'off-site'
  const isLate = selected?.status === 'late'
  const needsAction = isOffSite || isLate

  function handleSave() {
    if (!selectedName) return
    if (lateComment) setSavedComment(p => ({ ...p, [selectedName]: lateComment }))
    if (locationOverride) setSavedLocation(p => ({ ...p, [selectedName]: locationOverride }))
    setLateComment('')
    setLocationOverride('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 52px)' }}>

      {/* Map — top half */}
      <div style={{ position: 'relative', flexShrink: 0, height: 260, background: '#e8ecef' }}>
        <Suspense fallback={
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--color-ink-faint)' }}>Loading map…</div>
        }>
          <StaffLocationMap selectedStaff={selectedName} onSelectStaff={n => setSelectedName(n === selectedName ? null : n)} />
        </Suspense>

        {/* Map legend */}
        <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 500, background: 'white', borderRadius: 8, padding: '7px 10px', boxShadow: '0 1px 6px rgba(0,0,0,0.14)', display: 'flex', flexDirection: 'column', gap: 5 }}>
          <LegendDot color="#2a9d6f" label="On-site" />
          <LegendDot color="#dc3545" label="Off-site" />
          <LegendDot color="#1a6b7a" shape="square" label="House" />
        </div>

        {/* Dismiss selection */}
        {selectedName && (
          <button onClick={() => setSelectedName(null)} style={{ position: 'absolute', top: 8, right: 8, zIndex: 500, background: 'white', border: 'none', borderRadius: 20, padding: '5px 11px', fontSize: 12, fontWeight: 600, color: 'var(--color-ink-muted)', cursor: 'pointer', boxShadow: '0 1px 6px rgba(0,0,0,0.14)' }}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* Selected staff action panel */}
      {selected && (
        <div style={{ background: 'white', borderBottom: '1px solid var(--color-border)', padding: '14px 16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: needsAction ? 12 : 0 }}>
            <Avatar name={selected.name} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-ink)' }}>{selected.name}</div>
              <div style={{ fontSize: 12, color: 'var(--color-ink-faint)' }}>{selected.role} · {selected.house}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, ...STATUS_STYLE[selected.status] }}>{STATUS_STYLE[selected.status].label}</span>
              {isOffSite && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: '#fce8e8', color: '#dc3545' }}>⚠ Off-site</span>}
            </div>
          </div>

          {/* Info row */}
          <div style={{ display: 'flex', gap: 16, marginBottom: needsAction ? 12 : 0 }}>
            <span style={{ fontSize: 12, color: 'var(--color-ink-faint)' }}>Shift: <strong style={{ color: 'var(--color-ink)' }}>{selected.shift}</strong></span>
            <span style={{ fontSize: 12, color: 'var(--color-ink-faint)' }}>Clocked: <strong style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}>{selected.clocked}</strong></span>
          </div>

          {/* Saved note */}
          {(savedComment[selected.name] || savedLocation[selected.name]) && (
            <div style={{ background: 'var(--color-surface)', borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: 12.5, color: 'var(--color-ink-muted)' }}>
              {savedLocation[selected.name] && <div>📍 Location set to: <strong>{savedLocation[selected.name]}</strong></div>}
              {savedComment[selected.name] && <div style={{ marginTop: savedLocation[selected.name] ? 3 : 0 }}>💬 "{savedComment[selected.name]}"</div>}
            </div>
          )}

          {/* Action fields — only when late or off-site */}
          {needsAction && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Location override */}
              <select
                value={locationOverride}
                onChange={e => setLocationOverride(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--color-border)', fontSize: 13.5, color: locationOverride ? 'var(--color-ink)' : 'var(--color-ink-faint)', background: 'white', outline: 'none', cursor: 'pointer' }}
              >
                <option value="">Set correct location…</option>
                {HOUSES.map(h => <option key={h} value={h}>{h}</option>)}
              </select>

              {/* Late reason */}
              {isLate && (
                <input
                  value={lateComment}
                  onChange={e => setLateComment(e.target.value)}
                  placeholder="Reason for late arrival…"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--color-border)', fontSize: 13.5, color: 'var(--color-ink)', background: 'white', outline: 'none', boxSizing: 'border-box' } as React.CSSProperties}
                />
              )}

              {(lateComment || locationOverride) && (
                <button onClick={handleSave} style={{ padding: '11px', borderRadius: 10, border: 'none', background: 'var(--color-brand)', color: 'white', cursor: 'pointer', fontSize: 13.5, fontWeight: 700 }}>
                  Save
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Scrollable staff list */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        {EMPLOYEES.map((emp, i) => {
          const st = STATUS_STYLE[emp.status]
          const loc = STAFF_LOCATIONS.find(s => s.name === emp.name)
          const isSelected = selectedName === emp.name
          const offSite = loc?.status === 'off-site'
          return (
            <button key={i} onClick={() => setSelectedName(isSelected ? null : emp.name)} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '13px 16px', border: 'none', borderBottom: '1px solid var(--color-border)', background: isSelected ? 'var(--color-brand-light)' : 'white', cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <Avatar name={emp.name} size={38} />
                {loc && (
                  <div style={{ position: 'absolute', bottom: -1, right: -1, width: 11, height: 11, borderRadius: '50%', background: offSite ? '#dc3545' : '#2a9d6f', border: '2px solid white' }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)', marginBottom: 1 }}>{emp.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--color-ink-faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.role} · {emp.house}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: st.bg, color: st.color }}>{st.label}</span>
                {offSite && <span style={{ fontSize: 9, fontWeight: 700, color: '#dc3545' }}>⚠ off-site</span>}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2)
  const hue = name.charCodeAt(0) * 7 % 360
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `hsl(${hue}, 45%, 55%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, color: 'white', flexShrink: 0 }}>
      {initials}
    </div>
  )
}

function LegendDot({ color, label, shape = 'circle' }: { color: string; label: string; shape?: 'circle' | 'square' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 9, height: 9, borderRadius: shape === 'circle' ? '50%' : 2, background: color, border: '1.5px solid white', boxShadow: `0 0 0 1px ${color}55`, transform: shape === 'square' ? 'rotate(45deg)' : 'none', flexShrink: 0 }} />
      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-ink-muted)' }}>{label}</span>
    </div>
  )
}
