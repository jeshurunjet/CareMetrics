import { useState } from 'react'

const RECORDS = [
  { client: 'George Henare', section: 'Fluid Balance', house: 'Sunrise House', staff: 'Aroha Ngata', time: 'Today 08:15', value: '820ml intake', status: 'flagged' },
  { client: 'Margaret Liu', section: 'Seizure Monitoring', house: 'Oaklands Service', staff: 'Lena Costa', time: 'Today 07:45', value: 'Tonic-clonic, 2min 30sec', status: 'flagged' },
  { client: 'Sarah Mitchell', section: 'Daily Diary', house: 'Sunrise House', staff: 'Aroha Ngata', time: 'Today 09:00', value: 'Morning routine — positive mood', status: 'complete' },
  { client: 'Robert Parata', section: 'Blood Glucose', house: 'Cedar Hill', staff: 'Daniel Park', time: 'Today 07:30', value: '7.1 mmol/L — in range', status: 'complete' },
  { client: 'Peter Tumai', section: 'Sleep Monitoring', house: 'Riverside Lodge', staff: 'Grace Tūhoe', time: 'Yesterday', value: '5h 20min — below target', status: 'outstanding' },
  { client: 'George Henare', section: 'Weight', house: 'Sunrise House', staff: '—', time: 'Overdue 7 days', value: 'Not recorded', status: 'outstanding' },
]

const STATUS: Record<string, { label: string; bg: string; color: string }> = {
  complete: { label: 'Complete', bg: '#e6f7f1', color: '#2a9d6f' },
  flagged: { label: 'Flagged', bg: '#fce8e8', color: '#dc3545' },
  outstanding: { label: 'Outstanding', bg: '#fff7e0', color: '#d97706' },
}

export default function CareRecordsView() {
  const [filter, setFilter] = useState('all')

  const shown = RECORDS.filter(r => filter === 'all' || r.status === filter)

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Summary */}
      <div style={{ display: 'flex', gap: 10, padding: '12px 16px' }}>
        {[
          { label: 'Complete', value: RECORDS.filter(r => r.status === 'complete').length, color: '#2a9d6f', bg: '#e6f7f1' },
          { label: 'Flagged', value: RECORDS.filter(r => r.status === 'flagged').length, color: '#dc3545', bg: '#fce8e8' },
          { label: 'Outstanding', value: RECORDS.filter(r => r.status === 'outstanding').length, color: '#d97706', bg: '#fff7e0' },
        ].map(c => (
          <button key={c.label} onClick={() => setFilter(filter === c.label.toLowerCase() ? 'all' : c.label.toLowerCase())} style={{ flex: 1, background: filter === c.label.toLowerCase() ? c.color : c.bg, borderRadius: 12, padding: '12px 8px', textAlign: 'center', border: 'none', cursor: 'pointer', transition: 'all 0.15s' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: filter === c.label.toLowerCase() ? 'white' : c.color, lineHeight: 1 }}>{c.value}</div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: filter === c.label.toLowerCase() ? 'rgba(255,255,255,0.8)' : c.color, opacity: filter === c.label.toLowerCase() ? 1 : 0.75, marginTop: 3 }}>{c.label}</div>
          </button>
        ))}
      </div>

      <div style={{ padding: '0 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: 'var(--color-ink-faint)', fontWeight: 600 }}>{shown.length} records</span>
        <button style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: 'var(--color-brand)', color: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>+ New Record</button>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {shown.map((r, i) => {
          const s = STATUS[r.status]
          return (
            <div key={i} style={{ background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-ink)' }}>{r.client}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--color-brand)', fontWeight: 500, marginTop: 2 }}>{r.section}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: s.bg, color: s.color, flexShrink: 0, marginLeft: 8 }}>{s.label}</span>
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--color-ink)', marginBottom: 8, lineHeight: 1.4 }}>{r.value}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--color-ink-faint)' }}>{r.house} · {r.staff}</span>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-ink-faint)' }}>{r.time}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
