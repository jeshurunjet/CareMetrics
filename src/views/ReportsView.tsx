const REPORTS = [
  { category: 'Client', color: 'var(--color-brand)', bg: 'var(--color-brand-light)', reports: ['Client Summary Report', 'Client Progress Notes', 'Daily Diary Summary'] },
  { category: 'Care', color: '#2a9d6f', bg: '#e6f7f1', reports: ['Care Records by Client', 'Health Trends', 'Outstanding Records', 'Flagged Incidents'] },
  { category: 'Staffing', color: '#d97706', bg: '#fff7e0', reports: ['Attendance Summary', 'Timesheet Report', 'Shift Coverage'] },
  { category: 'Leave', color: '#3b82f6', bg: '#e6f0fd', reports: ['Leave Usage by Employee', 'Leave Balance Summary', 'Leave History Export'] },
]

export default function ReportsView() {
  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Quick export banner */}
      <div style={{ margin: '12px 16px', background: 'linear-gradient(135deg, #1a6b7a, #2d8fa0)', borderRadius: 16, padding: '18px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 400, color: 'white', margin: '0 0 6px' }}>Quick Export</h2>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Today's operational snapshot — care, attendance, and shift data.</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Export CSV</button>
          <button style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: 'white', color: 'var(--color-brand)', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Export PDF</button>
        </div>
      </div>

      {/* Report groups */}
      <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {REPORTS.map((group, i) => (
          <div key={i} style={{ background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: group.color }} />
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: group.color }}>{group.category}</span>
            </div>
            {group.reports.map((report, ri, arr) => (
              <button key={ri} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '14px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--color-ink)', textAlign: 'left', borderBottom: ri < arr.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                <span>{report}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-faint)" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
