const SHIFTS = [
  { day: 'Mon', date: '11 Aug', house: 'Riverside Lodge', shift: '08:00–16:00', status: 'completed' },
  { day: 'Tue', date: '12 Aug', house: 'Riverside Lodge', shift: '08:00–16:00', status: 'completed' },
  { day: 'Wed', date: '13 Aug', house: 'Riverside Lodge', shift: '08:00–16:00', status: 'active' },
  { day: 'Thu', date: '14 Aug', house: 'Riverside Lodge', shift: '08:00–16:00', status: 'upcoming' },
  { day: 'Fri', date: '15 Aug', house: 'Riverside Lodge', shift: '08:00–16:00', status: 'upcoming' },
  { day: 'Sat', date: '16 Aug', house: '', shift: '', status: 'off' },
  { day: 'Sun', date: '17 Aug', house: '', shift: '', status: 'off' },
  { day: 'Mon', date: '18 Aug', house: 'Riverside Lodge', shift: '15:00–23:00', status: 'upcoming' },
  { day: 'Tue', date: '19 Aug', house: 'Riverside Lodge', shift: '15:00–23:00', status: 'upcoming' },
]

export default function MyRosterView() {
  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Week strip stats */}
      <div style={{ display: 'flex', gap: 10, padding: '12px 16px' }}>
        {[
          { label: 'This Week', value: '5', sub: 'shifts', color: 'var(--color-brand)', bg: 'var(--color-brand-light)' },
          { label: 'Hours', value: '40', sub: 'scheduled', color: '#2a9d6f', bg: '#e6f7f1' },
          { label: 'Next', value: '4', sub: 'shifts', color: '#d97706', bg: '#fff7e0' },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, background: s.bg, borderRadius: 12, padding: '12px 10px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: s.color, opacity: 0.75, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {SHIFTS.map((s, i) => {
          const isToday = s.status === 'active'
          return (
            <div key={i} style={{ background: isToday ? 'var(--color-brand-light)' : 'white', borderRadius: 14, border: isToday ? '2px solid var(--color-brand)' : '1px solid var(--color-border)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, flexShrink: 0, textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: isToday ? 'var(--color-brand)' : 'var(--color-ink-faint)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.day}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: isToday ? 'var(--color-brand)' : 'var(--color-ink-muted)', marginTop: 1 }}>{s.date.split(' ')[0]}</div>
              </div>
              <div style={{ flex: 1 }}>
                {s.house ? (
                  <>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)' }}>{s.house}</div>
                    <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-ink-muted)', marginTop: 2 }}>{s.shift}</div>
                  </>
                ) : (
                  <div style={{ fontSize: 14, color: 'var(--color-ink-faint)' }}>Day Off</div>
                )}
              </div>
              {isToday && <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: 'var(--color-brand)', color: 'white', flexShrink: 0 }}>TODAY</span>}
              {s.status === 'completed' && <span style={{ fontSize: 16, color: '#2a9d6f', flexShrink: 0 }}>✓</span>}
              {s.status === 'off' && <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: 'var(--color-surface)', color: 'var(--color-ink-faint)', flexShrink: 0 }}>Off</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
