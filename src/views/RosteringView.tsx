import { useState } from 'react'

const DAYS = ['Mon 11', 'Tue 12', 'Wed 13', 'Thu 14', 'Fri 15', 'Sat 16', 'Sun 17']
const TODAY = 2

const STAFF = [
  { name: 'Aroha Ngata', house: 'Sunrise House', shifts: ['07:00–15:00', '07:00–15:00', '07:00–15:00', '', '07:00–15:00', '', ''] },
  { name: 'Marcus Bell', house: 'Oaklands Service', shifts: ['leave', 'leave', 'leave', 'leave', 'leave', '', ''] },
  { name: 'Jamie Taufa', house: 'Riverside Lodge', shifts: ['', '15:00–23:00', '08:00–16:00', '08:00–16:00', '08:00–16:00', '08:00–16:00', ''] },
  { name: 'Priya Sharma', house: 'Sunrise House', shifts: ['07:30–15:30', '07:30–15:30', '07:30–15:30', '07:30–15:30', '', '', ''] },
  { name: 'Sam Wilson', house: 'Cedar Hill', shifts: ['09:00–17:00', '', '09:00–17:00', '09:00–17:00', '09:00–17:00', '09:00–17:00', '09:00–17:00'] },
  { name: 'Lena Costa', house: 'Oaklands Service', shifts: ['15:00–23:00', '15:00–23:00', '', '15:00–23:00', '15:00–23:00', '', ''] },
  { name: 'Daniel Park', house: 'Cedar Hill', shifts: ['08:00–16:00', '08:00–16:00', '08:00–16:00', '08:00–16:00', '08:00–16:00', '', ''] },
  { name: 'Grace Tūhoe', house: 'Riverside Lodge', shifts: ['15:00–23:00', '', '15:00–23:00', '', '15:00–23:00', '09:00–17:00', '09:00–17:00'] },
]

function shiftStyle(shift: string) {
  if (!shift) return null
  if (shift === 'leave') return { bg: '#e6f0fd', color: '#3b82f6', label: 'Leave' }
  if (shift.startsWith('07') || shift.startsWith('08') || shift.startsWith('09')) return { bg: '#e6f7f1', color: '#2a9d6f', label: shift }
  if (shift.startsWith('15') || shift.startsWith('16')) return { bg: 'var(--color-brand-light)', color: 'var(--color-brand)', label: shift }
  return { bg: '#f5f0ff', color: '#7c3aed', label: shift }
}

export default function RosteringView() {
  const [dayIdx, setDayIdx] = useState(TODAY)
  const [house, setHouse] = useState('all')

  const todayStaff = STAFF.filter(s =>
    (house === 'all' || s.house === house) && s.shifts[dayIdx]
  )

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Day selector — horizontal scroll */}
      <div style={{ overflowX: 'auto', padding: '12px 16px 0', display: 'flex', gap: 8, scrollbarWidth: 'none' }}>
        {DAYS.map((day, i) => (
          <button key={i} onClick={() => setDayIdx(i)} style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 600, background: dayIdx === i ? 'var(--color-brand)' : 'white', color: dayIdx === i ? 'white' : i === TODAY ? 'var(--color-brand)' : 'var(--color-ink-muted)', border: i === TODAY && dayIdx !== i ? '1.5px solid var(--color-brand)' : '1px solid transparent', boxShadow: dayIdx === i ? '0 2px 8px rgba(26,107,122,0.3)' : 'none' }}>
            {day}
          </button>
        ))}
      </div>

      {/* House filter */}
      <div style={{ padding: '12px 16px' }}>
        <select value={house} onChange={e => setHouse(e.target.value)} style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1px solid var(--color-border)', background: 'white', fontSize: 14, outline: 'none', cursor: 'pointer', color: 'var(--color-ink)' }}>
          <option value="all">All Houses</option>
          <option value="Sunrise House">Sunrise House</option>
          <option value="Oaklands Service">Oaklands Service</option>
          <option value="Riverside Lodge">Riverside Lodge</option>
          <option value="Cedar Hill">Cedar Hill</option>
        </select>
      </div>

      {/* Summary */}
      <div style={{ margin: '0 16px 12px', display: 'flex', gap: 10 }}>
        {[
          { label: 'Scheduled', value: todayStaff.length, color: 'var(--color-brand)', bg: 'var(--color-brand-light)' },
          { label: 'On Leave', value: todayStaff.filter(s => s.shifts[dayIdx] === 'leave').length, color: '#3b82f6', bg: '#e6f0fd' },
          { label: 'Working', value: todayStaff.filter(s => s.shifts[dayIdx] && s.shifts[dayIdx] !== 'leave').length, color: '#2a9d6f', bg: '#e6f7f1' },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, background: s.bg, borderRadius: 12, padding: '11px 12px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: s.color, opacity: 0.75, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Staff list for selected day */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {todayStaff.map((staff, i) => {
          const s = shiftStyle(staff.shifts[dayIdx])!
          return (
            <div key={i} style={{ background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name={staff.name} size={40} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)' }}>{staff.name}</div>
                <div style={{ fontSize: 12, color: 'var(--color-ink-faint)' }}>{staff.house}</div>
              </div>
              <div style={{ background: s.bg, color: s.color, fontSize: 12, fontWeight: 700, borderRadius: 8, padding: '6px 10px', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
                {s.label}
              </div>
            </div>
          )
        })}

        {todayStaff.length === 0 && (
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', padding: '32px 16px', textAlign: 'center', color: 'var(--color-ink-faint)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>No shifts scheduled</div>
          </div>
        )}

        <button style={{ padding: '14px', borderRadius: 14, border: '2px dashed var(--color-border)', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--color-brand)' }}>
          + Create Shift
        </button>
      </div>

      {/* Legend */}
      <div style={{ margin: '16px 16px 0', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {[
          { bg: '#e6f7f1', color: '#2a9d6f', label: 'Morning' },
          { bg: 'var(--color-brand-light)', color: 'var(--color-brand)', label: 'Afternoon' },
          { bg: '#f5f0ff', color: '#7c3aed', label: 'Night' },
          { bg: '#e6f0fd', color: '#3b82f6', label: 'Leave' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: l.bg, border: `1px solid ${l.color}40` }} />
            <span style={{ fontSize: 11, color: 'var(--color-ink-muted)' }}>{l.label}</span>
          </div>
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
