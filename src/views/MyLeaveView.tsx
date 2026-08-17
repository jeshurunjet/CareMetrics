import { useState } from 'react'

export default function MyLeaveView() {
  const [showForm, setShowForm] = useState(false)
  const [type, setType] = useState('Annual Leave')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [reason, setReason] = useState('')

  const history = [
    { type: 'Annual Leave', from: '2026-07-14', to: '2026-07-18', days: 5, status: 'approved' },
    { type: 'Sick Leave', from: '2026-06-02', to: '2026-06-02', days: 1, status: 'approved' },
    { type: 'Annual Leave', from: '2025-12-22', to: '2026-01-02', days: 9, status: 'approved' },
  ]

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Balances */}
      <div style={{ display: 'flex', gap: 10, padding: '12px 16px' }}>
        {[
          { label: 'Annual', value: 12, total: 20, color: 'var(--color-brand)', bg: 'var(--color-brand-light)' },
          { label: 'Sick', value: 10, total: 10, color: '#2a9d6f', bg: '#e6f7f1' },
          { label: 'Taken', value: 8, total: 20, color: '#d97706', bg: '#fff7e0' },
        ].map(b => (
          <div key={b.label} style={{ flex: 1, background: b.bg, borderRadius: 14, padding: '14px 10px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, color: b.color, lineHeight: 1, textAlign: 'center' }}>{b.value}</div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: b.color, opacity: 0.75, textAlign: 'center', marginTop: 3 }}>{b.label}</div>
            <div style={{ marginTop: 8, height: 4, background: 'rgba(0,0,0,0.08)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${(b.value / b.total) * 100}%`, height: '100%', background: b.color, borderRadius: 2 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Request button */}
      <div style={{ padding: '0 16px 16px' }}>
        <button onClick={() => setShowForm(f => !f)} style={{ width: '100%', padding: '14px', borderRadius: 14, cursor: 'pointer', fontSize: 14, fontWeight: 700, background: showForm ? 'var(--color-surface)' : 'var(--color-brand)', color: showForm ? 'var(--color-ink)' : 'white', border: showForm ? '1px solid var(--color-border)' : 'none' }}>
          {showForm ? 'Cancel Request' : '+ Request Leave'}
        </button>
      </div>

      {/* Leave form */}
      {showForm && (
        <div style={{ margin: '0 16px 16px', background: 'white', borderRadius: 16, border: '1px solid var(--color-border)', padding: '18px 16px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400, margin: '0 0 16px', color: 'var(--color-ink)' }}>Request Leave</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-ink-faint)', marginBottom: 6 }}>Type</label>
              <select value={type} onChange={e => setType(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid var(--color-border)', fontSize: 14, outline: 'none', cursor: 'pointer', background: 'white', color: 'var(--color-ink)' }}>
                <option>Annual Leave</option>
                <option>Sick Leave</option>
                <option>Bereavement Leave</option>
                <option>Parental Leave</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-ink-faint)', marginBottom: 6 }}>From</label>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid var(--color-border)', fontSize: 14, outline: 'none', color: 'var(--color-ink)', boxSizing: 'border-box' } as React.CSSProperties} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-ink-faint)', marginBottom: 6 }}>To</label>
              <input type="date" value={to} onChange={e => setTo(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid var(--color-border)', fontSize: 14, outline: 'none', color: 'var(--color-ink)', boxSizing: 'border-box' } as React.CSSProperties} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-ink-faint)', marginBottom: 6 }}>Reason (optional)</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Add a note for your manager…" style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid var(--color-border)', fontSize: 14, outline: 'none', resize: 'none', fontFamily: 'var(--font-sans)', color: 'var(--color-ink)', boxSizing: 'border-box' } as React.CSSProperties} />
            </div>
            <button onClick={() => setShowForm(false)} style={{ padding: '14px', borderRadius: 12, border: 'none', background: 'var(--color-brand)', color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>Submit Request</button>
          </div>
        </div>
      )}

      {/* History */}
      <div style={{ margin: '0 16px', background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--color-border)' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink)' }}>Leave History</span>
        </div>
        {history.map((h, i) => (
          <div key={i} style={{ padding: '14px 16px', borderBottom: i < history.length - 1 ? '1px solid var(--color-border)' : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)' }}>{h.type}</div>
              <div style={{ fontSize: 12, color: 'var(--color-ink-faint)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{h.from} → {h.to} · {h.days}d</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#e6f7f1', color: '#2a9d6f' }}>Approved</span>
          </div>
        ))}
      </div>
    </div>
  )
}
