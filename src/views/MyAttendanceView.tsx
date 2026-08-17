import { useState } from 'react'

const RECORDS = [
  { date: '2026-08-17', day: 'Monday', house: 'Riverside Lodge', scheduled: '08:00–16:00', clockIn: '08:04', clockOut: null, worked: '—', status: 'active' },
  { date: '2026-08-16', day: 'Sunday', house: 'Riverside Lodge', scheduled: 'Off', clockIn: null, clockOut: null, worked: '—', status: 'off' },
  { date: '2026-08-15', day: 'Saturday', scheduled: '08:00–16:00', house: 'Riverside Lodge', clockIn: '08:01', clockOut: '16:02', worked: '8h 01m', status: 'complete' },
  { date: '2026-08-14', day: 'Friday', scheduled: '08:00–16:00', house: 'Riverside Lodge', clockIn: '08:12', clockOut: '16:00', worked: '7h 48m', status: 'late' },
  { date: '2026-08-13', day: 'Thursday', scheduled: '08:00–16:00', house: 'Riverside Lodge', clockIn: '07:58', clockOut: '16:05', worked: '8h 07m', status: 'complete' },
  { date: '2026-08-12', day: 'Wednesday', scheduled: '08:00–16:00', house: 'Riverside Lodge', clockIn: '08:03', clockOut: '16:02', worked: '7h 59m', status: 'complete' },
  { date: '2026-08-11', day: 'Tuesday', scheduled: '08:00–16:00', house: 'Riverside Lodge', clockIn: '08:00', clockOut: '16:00', worked: '8h 00m', status: 'complete' },
]

const STATUS_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  complete: { label: 'Complete', bg: '#e6f7f1', color: '#2a9d6f' },
  active: { label: 'On Shift', bg: '#e6f3f5', color: 'var(--color-brand)' },
  late: { label: 'Late', bg: '#fff3e0', color: '#d97706' },
  off: { label: 'Day Off', bg: 'var(--color-surface)', color: 'var(--color-ink-faint)' },
}

export default function MyAttendanceView() {
  const [showRequest, setShowRequest] = useState(false)

  const completed = RECORDS.filter(r => r.status === 'complete')
  const totalWorked = completed.length * 8

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, margin: '0 0 4px', color: 'var(--color-ink)' }}>My Timesheets</h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--color-ink-faint)' }}>Week of 11–17 August 2026</p>
        </div>
        <button onClick={() => setShowRequest(!showRequest)} style={{ padding: '9px 18px', borderRadius: 9, border: '1.5px solid var(--color-border)', background: 'white', color: 'var(--color-ink)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          Request Correction
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Hours This Week', value: `${totalWorked}h`, color: 'var(--color-brand)' },
          { label: 'Shifts Complete', value: completed.length, color: '#2a9d6f' },
          { label: 'Late Arrivals', value: RECORDS.filter(r => r.status === 'late').length, color: '#d97706' },
          { label: 'Days Off', value: RECORDS.filter(r => r.status === 'off').length, color: 'var(--color-ink-faint)' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'white', borderRadius: 12, padding: '18px 20px', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-display)', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--color-ink-faint)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Correction request form */}
      {showRequest && (
        <div style={{ background: '#e6f3f5', border: '1px solid rgba(26,107,122,0.15)', borderRadius: 12, padding: '20px 22px', marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-brand)', marginBottom: 14 }}>Request Attendance Correction</div>
          <p style={{ fontSize: 13, color: 'var(--color-ink-muted)', margin: '0 0 14px', lineHeight: 1.5 }}>If you believe your attendance record contains an error, submit a correction request to your manager for review. You cannot alter approved records directly.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div><label style={labelStyle}>Date</label><input type="date" style={inputStyle} defaultValue="2026-08-14" /></div>
            <div><label style={labelStyle}>Issue Type</label><select style={inputStyle}><option>Incorrect clock-in time</option><option>Incorrect clock-out time</option><option>Missing record</option><option>Other</option></select></div>
          </div>
          <div style={{ marginBottom: 12 }}><label style={labelStyle}>Details</label><textarea rows={3} style={{ ...inputStyle, width: '100%', resize: 'vertical', boxSizing: 'border-box' } as React.CSSProperties} placeholder="Describe the issue…" /></div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={btnPrimary}>Submit Request</button>
            <button onClick={() => setShowRequest(false)} style={{ padding: '9px 18px', borderRadius: 9, border: '1.5px solid var(--color-border)', background: 'white', color: 'var(--color-ink)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Records */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 1fr 1fr 100px', gap: 12, padding: '11px 20px', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
          {['Date', 'House', 'Scheduled', 'Clock In', 'Clock Out', 'Status'].map(c => (
            <span key={c} style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-ink-faint)' }}>{c}</span>
          ))}
        </div>
        {RECORDS.map((r, i) => {
          const st = STATUS_STYLE[r.status]
          const isToday = r.status === 'active'
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 1fr 1fr 100px', gap: 12, padding: '14px 20px', borderBottom: i < RECORDS.length - 1 ? '1px solid var(--color-border)' : 'none', background: isToday ? '#f0f8fa' : 'white', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: isToday ? 700 : 500, color: 'var(--color-ink)' }}>{r.day}</div>
                <div style={{ fontSize: 11, color: 'var(--color-ink-faint)', fontFamily: 'var(--font-mono)' }}>{r.date.slice(5)}</div>
              </div>
              <span style={{ fontSize: 13, color: 'var(--color-ink-muted)' }}>{r.house ?? '—'}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-ink-muted)' }}>{r.scheduled}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: r.status === 'late' ? '#d97706' : 'var(--color-ink)' }}>{r.clockIn ?? '—'}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-ink)' }}>{r.clockOut ?? '—'}</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: st.bg, color: st.color, whiteSpace: 'nowrap' }}>{st.label}</span>
            </div>
          )
        })}
      </div>

      <p style={{ marginTop: 14, fontSize: 12, color: 'var(--color-ink-faint)', lineHeight: 1.5 }}>
        Your attendance records are reviewed and approved by your manager. Contact your manager or submit a correction request if you believe there is an error.
      </p>
    </div>
  )
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-ink)', marginBottom: 5 }
const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13, color: 'var(--color-ink)', outline: 'none', background: 'white', fontFamily: 'var(--font-sans)' }
const btnPrimary: React.CSSProperties = { padding: '9px 18px', borderRadius: 9, border: 'none', background: 'var(--color-brand)', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 700 }
