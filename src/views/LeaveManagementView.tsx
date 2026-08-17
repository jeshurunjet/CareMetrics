import { useState } from 'react'

type LeaveStatus = 'pending' | 'approved' | 'declined'

const INITIAL = [
  { id: 1, name: 'Marcus Bell', role: 'Support Worker', type: 'Annual Leave', from: '2026-08-18', to: '2026-08-22', days: 5, reason: 'Family holiday', status: 'pending' as LeaveStatus },
  { id: 2, name: 'Priya Sharma', role: 'Team Leader', type: 'Sick Leave', from: '2026-08-14', to: '2026-08-14', days: 1, reason: 'Unwell', status: 'pending' as LeaveStatus },
  { id: 3, name: 'Sam Wilson', role: 'Support Worker', type: 'Annual Leave', from: '2026-09-01', to: '2026-09-05', days: 5, reason: 'Planned travel', status: 'pending' as LeaveStatus },
  { id: 4, name: 'Aroha Ngata', role: 'Senior Support Worker', type: 'Bereavement', from: '2026-08-15', to: '2026-08-16', days: 2, reason: 'Family bereavement', status: 'approved' as LeaveStatus },
  { id: 5, name: 'Jamie Taufa', role: 'Support Worker', type: 'Annual Leave', from: '2026-07-28', to: '2026-07-31', days: 4, reason: 'Break', status: 'approved' as LeaveStatus },
]

const STATUS_STYLE: Record<LeaveStatus, { bg: string; color: string }> = {
  pending: { bg: '#fff7e0', color: '#d97706' },
  approved: { bg: '#e6f7f1', color: '#2a9d6f' },
  declined: { bg: '#fce8e8', color: '#dc3545' },
}

const TYPE_COLOR: Record<string, string> = {
  'Annual Leave': 'var(--color-brand)',
  'Sick Leave': '#e8834a',
  'Bereavement': '#6b7280',
}

export default function LeaveManagementView() {
  const [requests, setRequests] = useState(INITIAL)
  const [tab, setTab] = useState<'pending' | 'all' | 'balances'>('pending')

  function update(id: number, status: LeaveStatus) {
    setRequests(r => r.map(req => req.id === id ? { ...req, status } : req))
  }

  const shown = tab === 'pending' ? requests.filter(r => r.status === 'pending') : tab === 'all' ? requests : []
  const pending = requests.filter(r => r.status === 'pending')

  const balances = [
    { name: 'Aroha Ngata', annual: 18, sick: 3, taken: 6 },
    { name: 'Marcus Bell', annual: 14, sick: 10, taken: 4 },
    { name: 'Jamie Taufa', annual: 12, sick: 10, taken: 8 },
    { name: 'Priya Sharma', annual: 21, sick: 8, taken: 3 },
    { name: 'Sam Wilson', annual: 9, sick: 10, taken: 11 },
  ]

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Summary strip */}
      <div style={{ display: 'flex', gap: 10, padding: '12px 16px' }}>
        {[
          { label: 'Pending', value: pending.length, color: '#d97706', bg: '#fff7e0' },
          { label: 'Approved', value: requests.filter(r => r.status === 'approved').length, color: '#2a9d6f', bg: '#e6f7f1' },
          { label: 'On Leave Now', value: 1, color: '#3b82f6', bg: '#e6f0fd' },
        ].map(c => (
          <div key={c.label} style={{ flex: 1, background: c.bg, borderRadius: 12, padding: '12px 10px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: c.color, lineHeight: 1 }}>{c.value}</div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: c.color, opacity: 0.75, marginTop: 3 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', padding: '0 16px 12px', gap: 8 }}>
        {([['pending', `Pending (${pending.length})`], ['all', 'All'], ['balances', 'Balances']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: '9px 4px', borderRadius: 20, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, background: tab === id ? 'var(--color-brand)' : 'white', color: tab === id ? 'white' : 'var(--color-ink-muted)', border: tab === id ? 'none' : '1px solid var(--color-border)' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Request cards */}
      {(tab === 'pending' || tab === 'all') && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {shown.length === 0 && (
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', padding: '32px 16px', textAlign: 'center', color: 'var(--color-ink-faint)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>All requests actioned</div>
            </div>
          )}
          {shown.map(req => {
            const ss = STATUS_STYLE[req.status]
            return (
              <div key={req.id} style={{ background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={req.name} size={40} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-ink)', marginBottom: 2 }}>{req.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-ink-faint)' }}>{req.role}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: ss.bg, color: ss.color, textTransform: 'capitalize' }}>{req.status}</span>
                </div>
                <div style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: (TYPE_COLOR[req.type] || '#666') + '18', color: TYPE_COLOR[req.type] || '#666' }}>{req.type}</span>
                    <span style={{ fontSize: 13, color: 'var(--color-ink-muted)' }}>{req.from === req.to ? req.from : `${req.from} → ${req.to}`} · {req.days}d</span>
                  </div>
                  {req.reason && <div style={{ fontSize: 13, color: 'var(--color-ink-muted)' }}>"{req.reason}"</div>}
                  {req.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                      <button onClick={() => update(req.id, 'approved')} style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: '#2a9d6f', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Approve</button>
                      <button onClick={() => update(req.id, 'declined')} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-ink-muted)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Decline</button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Balances */}
      {tab === 'balances' && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {balances.map((b, i) => (
            <div key={i} style={{ background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Avatar name={b.name} size={36} />
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-ink)' }}>{b.name}</span>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <BalancePill label="Annual" value={b.annual} color="var(--color-brand)" />
                <BalancePill label="Sick" value={b.sick} color="#e8834a" />
                <BalancePill label="Taken" value={b.taken} color="var(--color-ink-faint)" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function BalancePill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ flex: 1, textAlign: 'center', background: 'var(--color-surface)', borderRadius: 10, padding: '8px 4px' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color, opacity: 0.7, marginTop: 2 }}>{label}</div>
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
