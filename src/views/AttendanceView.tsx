import { useState } from 'react'

const RECORDS = [
  { employee: 'Aroha Ngata', house: 'Sunrise House', date: '2026-08-17', scheduled: '07:00–15:00', clockIn: '07:02', clockOut: '15:04', worked: '8h 02m', status: 'complete' },
  { employee: 'Priya Sharma', house: 'Sunrise House', date: '2026-08-17', scheduled: '07:30–15:30', clockIn: '07:31', clockOut: null, worked: '—', status: 'active' },
  { employee: 'Sam Wilson', house: 'Cedar Hill', date: '2026-08-17', scheduled: '09:00–17:00', clockIn: '09:18', clockOut: null, worked: '—', status: 'late' },
  { employee: 'Jamie Taufa', house: 'Riverside Lodge', date: '2026-08-17', scheduled: '08:00–16:00', clockIn: '08:04', clockOut: null, worked: '—', status: 'active' },
  { employee: 'Lena Costa', house: 'Oaklands Service', date: '2026-08-17', scheduled: '10:00–18:00', clockIn: null, clockOut: null, worked: '—', status: 'missing' },
  { employee: 'Daniel Park', house: 'Cedar Hill', date: '2026-08-17', scheduled: '08:00–16:00', clockIn: '08:02', clockOut: null, worked: '—', status: 'active' },
  { employee: "Grace Tūhoe", house: 'Riverside Lodge', date: '2026-08-17', scheduled: '15:00–23:00', clockIn: null, clockOut: null, worked: '—', status: 'upcoming' },
  { employee: 'Marcus Bell', house: 'Oaklands Service', date: '2026-08-17', scheduled: '—', clockIn: null, clockOut: null, worked: '—', status: 'leave' },
]

const STATUS_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  complete: { label: 'Complete', bg: '#e6f7f1', color: '#2a9d6f' },
  active: { label: 'On Shift', bg: '#e6f3f5', color: 'var(--color-brand)' },
  late: { label: 'Late', bg: '#fff3e0', color: '#d97706' },
  missing: { label: 'No Clock-in', bg: '#fce8e8', color: '#dc3545' },
  upcoming: { label: 'Upcoming', bg: 'var(--color-surface)', color: 'var(--color-ink-faint)' },
  leave: { label: 'On Leave', bg: '#e6f0fd', color: '#3b82f6' },
}

const HOUSES = ['All Houses', 'Sunrise House', 'Oaklands Service', 'Riverside Lodge', 'Cedar Hill']

export default function AttendanceView() {
  const [houseFilter, setHouseFilter] = useState('All Houses')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState<typeof RECORDS[0] | null>(null)

  const filtered = RECORDS.filter(r =>
    (houseFilter === 'All Houses' || r.house === houseFilter) &&
    (statusFilter === 'all' || r.status === statusFilter)
  )

  const exceptions = RECORDS.filter(r => r.status === 'late' || r.status === 'missing')

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, margin: '0 0 4px', color: 'var(--color-ink)' }}>Attendance</h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--color-ink-faint)' }}>Monday, 17 August 2026</p>
        </div>
        <button style={btnPrimary}>Export Report</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Scheduled', value: RECORDS.filter(r => r.status !== 'leave').length, color: 'var(--color-ink)' },
          { label: 'On Shift', value: RECORDS.filter(r => r.status === 'active').length, color: 'var(--color-brand)' },
          { label: 'Complete', value: RECORDS.filter(r => r.status === 'complete').length, color: '#2a9d6f' },
          { label: 'Late', value: RECORDS.filter(r => r.status === 'late').length, color: '#d97706' },
          { label: 'No Clock-in', value: RECORDS.filter(r => r.status === 'missing').length, color: '#dc3545' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'white', borderRadius: 12, padding: '16px 18px', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-display)', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--color-ink-faint)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Exceptions banner */}
      {exceptions.length > 0 && (
        <div style={{ background: '#fff7e0', border: '1px solid rgba(217,119,6,0.2)', borderRadius: 10, padding: '12px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#d97706', fontWeight: 700 }}>⚠</span>
          <span style={{ fontSize: 13, color: 'var(--color-ink)' }}>
            <strong>{exceptions.length} attendance exception{exceptions.length > 1 ? 's' : ''}</strong> require{exceptions.length === 1 ? 's' : ''} attention — {exceptions.map(e => e.employee).join(', ')}.
          </span>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
        <select value={houseFilter} onChange={e => setHouseFilter(e.target.value)} style={selectStyle}>
          {HOUSES.map(h => <option key={h}>{h}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_STYLE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <input type="date" defaultValue="2026-08-17" style={selectStyle} />
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.2fr 1fr 1fr 1fr 1fr 90px', gap: 12, padding: '11px 20px', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
          {['Employee', 'House', 'Scheduled', 'Clocked In', 'Clocked Out', 'Worked', 'Status'].map(c => (
            <span key={c} style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-ink-faint)' }}>{c}</span>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', fontSize: 14, color: 'var(--color-ink-faint)' }}>No attendance records match the current filters.</div>
        ) : filtered.map((r, i) => {
          const st = STATUS_STYLE[r.status]
          return (
            <button key={i} onClick={() => setSelected(r === selected ? null : r)} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.2fr 1fr 1fr 1fr 1fr 90px', gap: 12, padding: '14px 20px', background: selected === r ? 'var(--color-brand-light)' : 'white', width: '100%', border: 'none', borderBottom: i < filtered.length - 1 ? '1px solid var(--color-border)' : 'none', cursor: 'pointer', textAlign: 'left', alignItems: 'center', transition: 'background 0.1s' } as React.CSSProperties}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar name={r.employee} size={30} /><span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)' }}>{r.employee}</span></div>
              <span style={{ fontSize: 13, color: 'var(--color-ink-muted)' }}>{r.house}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-ink-muted)' }}>{r.scheduled}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: r.clockIn ? (r.status === 'late' ? '#d97706' : 'var(--color-ink)') : 'var(--color-ink-faint)' }}>{r.clockIn ?? '—'}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: r.clockOut ? 'var(--color-ink)' : 'var(--color-ink-faint)' }}>{r.clockOut ?? '—'}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-ink)' }}>{r.worked}</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: st.bg, color: st.color, whiteSpace: 'nowrap' }}>{st.label}</span>
            </button>
          )
        })}
      </div>

      {/* Detail drawer */}
      {selected && (
        <div style={{ marginTop: 20, background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name={selected.employee} size={42} />
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-ink)' }}>{selected.employee}</div>
                <div style={{ fontSize: 13, color: 'var(--color-ink-faint)' }}>{selected.house} · {selected.date}</div>
              </div>
            </div>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--color-ink-faint)' }}>×</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: selected.status === 'late' || selected.status === 'missing' ? 16 : 0 }}>
            <DetailCell label="Scheduled" value={selected.scheduled} />
            <DetailCell label="Clock In" value={selected.clockIn ?? 'Not recorded'} highlight={selected.status === 'late'} />
            <DetailCell label="Clock Out" value={selected.clockOut ?? 'Not yet'} />
            <DetailCell label="Worked" value={selected.worked} />
          </div>
          {(selected.status === 'late' || selected.status === 'missing') && (
            <div style={{ background: '#fff7e0', border: '1px solid rgba(217,119,6,0.15)', borderRadius: 9, padding: '12px 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#d97706', marginBottom: 8 }}>⚠ Exception — Action Required</div>
              {selected.status === 'late' && <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--color-ink-muted)' }}>This employee clocked in 18 minutes after their scheduled start time. Please review and add a note if required.</p>}
              {selected.status === 'missing' && <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--color-ink-muted)' }}>No clock-in has been recorded for this shift. Contact the employee to confirm their attendance status.</p>}
              <div style={{ display: 'flex', gap: 10 }}>
                <input placeholder="Add a note about this exception…" style={{ ...inputStyle, flex: 1 }} />
                <button style={btnPrimary}>Save Note</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DetailCell({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return <div><div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-ink-faint)', marginBottom: 4 }}>{label}</div><div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, color: highlight ? '#d97706' : 'var(--color-ink)' }}>{value}</div></div>
}
function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2)
  const hue = name.charCodeAt(0) * 7 % 360
  return <div style={{ width: size, height: size, borderRadius: '50%', background: `hsl(${hue},45%,55%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, color: 'white', flexShrink: 0 }}>{initials}</div>
}

const btnPrimary: React.CSSProperties = { padding: '9px 18px', borderRadius: 9, border: 'none', background: 'var(--color-brand)', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }
const selectStyle: React.CSSProperties = { padding: '9px 12px', borderRadius: 9, border: '1.5px solid var(--color-border)', fontSize: 13, color: 'var(--color-ink)', outline: 'none', background: 'white', cursor: 'pointer' }
const inputStyle: React.CSSProperties = { padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13, color: 'var(--color-ink)', outline: 'none', background: 'white', boxSizing: 'border-box' as const, fontFamily: 'var(--font-sans)' }
