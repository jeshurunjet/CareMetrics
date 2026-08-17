import { useState } from 'react'

const CLIENTS = [
  { name: 'George Henare', dob: '12 Mar 1978', age: 48, house: 'Sunrise House', alerts: 2, preferredName: 'George', conditions: ['Intellectual Disability', 'Epilepsy'] },
  { name: 'Margaret Liu', dob: '5 Jul 1965', age: 61, house: 'Oaklands Service', alerts: 1, preferredName: 'Maggie', conditions: ['ABI', 'Mobility Impairment'] },
  { name: 'Robert Parata', dob: '22 Nov 1989', age: 36, house: 'Cedar Hill', alerts: 1, preferredName: 'Rob', conditions: ['Down Syndrome', 'Diabetes Type 2'] },
  { name: 'Sarah Mitchell', dob: '8 Jan 1994', age: 32, house: 'Sunrise House', alerts: 0, preferredName: 'Sarah', conditions: ['Autism Spectrum Disorder'] },
  { name: 'Peter Tumai', dob: '30 Aug 1972', age: 53, house: 'Riverside Lodge', alerts: 1, preferredName: 'Pete', conditions: ['Cerebral Palsy', 'Vision Impairment'] },
  { name: 'Helen Karu', dob: '14 Apr 1981', age: 45, house: 'Oaklands Service', alerts: 0, preferredName: 'Helen', conditions: ['Intellectual Disability'] },
]

const CLIENT_TABS = ['Overview', 'Support', 'Diary', 'Health', 'Docs']

export default function ClientsView() {
  const [selected, setSelected] = useState<(typeof CLIENTS)[0] | null>(null)
  const [clientTab, setClientTab] = useState('Overview')
  const [search, setSearch] = useState('')

  const filtered = CLIENTS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.house.toLowerCase().includes(search.toLowerCase())
  )

  if (selected) {
    return (
      <div style={{ paddingBottom: 24 }}>
        {/* Client header */}
        <div style={{ background: 'linear-gradient(135deg, #1a6b7a, #2d8fa0)', padding: '16px 16px 20px' }}>
          <button onClick={() => setSelected(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'rgba(255,255,255,0.75)', cursor: 'pointer', fontSize: 14, fontWeight: 600, padding: 0, marginBottom: 14 }}>
            ← Clients
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <Avatar name={selected.name} size={52} />
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, color: 'white', margin: '0 0 3px' }}>{selected.name}</h2>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{selected.house} · {selected.age}y</div>
              {selected.alerts > 0 && (
                <span style={{ display: 'inline-block', marginTop: 5, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(220,53,69,0.85)', color: 'white' }}>⚠ {selected.alerts} Alert{selected.alerts !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
          {/* Tab strip */}
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {CLIENT_TABS.map(t => (
              <button key={t} onClick={() => setClientTab(t)} style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, background: clientTab === t ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)', color: 'white', transition: 'all 0.13s' }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {clientTab === 'Overview' && (
            <>
              <InfoCard title="Personal Details">
                <InfoRow label="Full Name" value={selected.name} />
                <InfoRow label="Preferred Name" value={selected.preferredName} />
                <InfoRow label="Date of Birth" value={selected.dob} />
                <InfoRow label="House" value={selected.house} last />
              </InfoCard>
              <InfoCard title="Conditions">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, padding: '4px 0' }}>
                  {selected.conditions.map((c, i) => (
                    <span key={i} style={{ fontSize: 13, fontWeight: 500, padding: '6px 12px', borderRadius: 8, background: 'var(--color-brand-light)', color: 'var(--color-brand)' }}>{c}</span>
                  ))}
                </div>
              </InfoCard>
              <InfoCard title="Emergency Contact">
                <InfoRow label="Name" value="Maria Henare" />
                <InfoRow label="Relationship" value="Mother" last />
              </InfoCard>
              <button style={{ padding: '14px', borderRadius: 12, border: 'none', background: 'var(--color-brand)', color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>+ New Diary Entry</button>
            </>
          )}

          {clientTab === 'Support' && (
            <>
              {selected.alerts > 0 && (
                <div style={{ background: '#fce8e8', borderRadius: 14, border: '1px solid rgba(220,53,69,0.2)', padding: '14px 16px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#dc3545', marginBottom: 6 }}>⚠ Seizure Risk</div>
                  <p style={{ margin: 0, fontSize: 13.5, color: 'var(--color-ink)', lineHeight: 1.5 }}>Has tonic-clonic seizures. Administer Midazolam if seizure &gt; 5 min. Call ambulance if second seizure occurs.</p>
                </div>
              )}
              <div style={{ background: '#fff7e0', borderRadius: 14, border: '1px solid rgba(217,119,6,0.2)', padding: '14px 16px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#d97706', marginBottom: 6 }}>Allergy — Penicillin</div>
                <p style={{ margin: 0, fontSize: 13.5, color: 'var(--color-ink)', lineHeight: 1.5 }}>Anaphylaxis risk. EpiPen in medication cupboard.</p>
              </div>
              <InfoCard title="Support Instructions">
                <p style={{ margin: 0, fontSize: 13.5, color: 'var(--color-ink)', lineHeight: 1.6 }}>
                  {selected.preferredName} requires 1:1 support during mealtimes. Use visual schedules and limit verbal instructions to single steps. Communicates using verbal speech and PECS cards.
                </p>
              </InfoCard>
            </>
          )}

          {clientTab === 'Diary' && (
            <>
              {[
                { time: '08:15', staff: 'Aroha Ngata', entry: `${selected.preferredName} had a good morning. Positive mood, engaged with activities.`, shift: 'Morning' },
                { time: 'Yesterday 21:30', staff: 'Lena Costa', entry: 'Evening routine completed. Some resistance to bedtime, settled well by 21:30.', shift: 'Evening' },
                { time: 'Yesterday 15:00', staff: 'Jamie Taufa', entry: `Afternoon outing to the park. ${selected.preferredName} enjoyed the walk.`, shift: 'Afternoon' },
              ].map((entry, i) => (
                <div key={i} style={{ background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <Avatar name={entry.staff} size={30} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-ink)' }}>{entry.staff}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-ink-faint)' }}>{entry.shift} Shift</div>
                    </div>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-ink-faint)' }}>{entry.time}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13.5, color: 'var(--color-ink)', lineHeight: 1.6 }}>{entry.entry}</p>
                </div>
              ))}
              <button style={{ padding: '14px', borderRadius: 14, border: '2px dashed var(--color-border)', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--color-brand)' }}>+ Add Entry</button>
            </>
          )}

          {clientTab === 'Health' && (
            <>
              {[
                { label: 'Fluid Balance', last: 'Today 08:00', status: 'alert', value: '820ml / 1500ml' },
                { label: 'Seizure Monitoring', last: 'Yesterday 14:30', status: 'ok', value: 'No seizure recorded' },
                { label: 'Bowel Monitoring', last: 'Yesterday 07:00', status: 'ok', value: 'Type 4 — normal' },
                { label: 'Sleep Monitoring', last: '2 days ago', status: 'warning', value: '5h 20min recorded' },
                { label: 'Blood Glucose', last: 'Today 07:45', status: 'ok', value: '6.2 mmol/L' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.status === 'ok' ? '#2a9d6f' : s.status === 'warning' ? '#d97706' : '#dc3545', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)' }}>{s.label}</div>
                    <div style={{ fontSize: 13, color: 'var(--color-brand)', fontWeight: 500, marginTop: 2 }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-ink-faint)', marginTop: 2 }}>Last: {s.last}</div>
                  </div>
                  <button style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--color-brand)', flexShrink: 0 }}>+ Add</button>
                </div>
              ))}
            </>
          )}

          {clientTab === 'Docs' && (
            <>
              {[
                { name: 'Support Plan 2026', type: 'PDF', date: 'Feb 2026' },
                { name: 'Behaviour Support Plan', type: 'PDF', date: 'Jan 2026' },
                { name: 'NDIS Plan Summary', type: 'PDF', date: 'Mar 2025' },
              ].map((doc, i) => (
                <div key={i} style={{ background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 9, background: '#fce8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#dc3545', flexShrink: 0 }}>PDF</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)' }}>{doc.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-ink-faint)' }}>{doc.date}</div>
                  </div>
                  <button style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: 'var(--color-ink)', flexShrink: 0 }}>↓</button>
                </div>
              ))}
              <button style={{ padding: '14px', borderRadius: 14, border: '2px dashed var(--color-border)', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--color-brand)' }}>+ Upload Document</button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Search */}
      <div style={{ padding: '12px 16px', display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1px solid var(--color-border)', borderRadius: 12, padding: '10px 12px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-faint)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients…" style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 14, color: 'var(--color-ink)', width: '100%' }} />
        </div>
        <button style={{ padding: '10px 14px', borderRadius: 12, border: 'none', background: 'var(--color-brand)', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>+ Add</button>
      </div>

      <div style={{ padding: '0 16px 8px', fontSize: 12, color: 'var(--color-ink-faint)', fontWeight: 600 }}>{filtered.length} clients</div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map((c, i) => (
          <button key={i} onClick={() => { setSelected(c); setClientTab('Overview') }} style={{ background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', padding: '14px 16px', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <Avatar name={c.name} size={42} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-ink)' }}>{c.preferredName} {c.name.split(' ')[1]}</div>
                <div style={{ fontSize: 12.5, color: 'var(--color-ink-faint)' }}>{c.house} · {c.age}y</div>
              </div>
              {c.alerts > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 12, background: '#fce8e8', color: '#dc3545', flexShrink: 0 }}>⚠ {c.alerts}</span>
              )}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-faint)" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {c.conditions.map((cond, ci) => (
                <span key={ci} style={{ fontSize: 11, background: 'var(--color-surface)', color: 'var(--color-ink-muted)', padding: '3px 9px', borderRadius: 6, fontWeight: 500 }}>{cond}</span>
              ))}
            </div>
          </button>
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

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
      <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-ink-faint)' }}>{title}</span>
      </div>
      <div style={{ padding: '4px 16px 8px' }}>{children}</div>
    </div>
  )
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '10px 0', borderBottom: last ? 'none' : '1px solid var(--color-border)' }}>
      <span style={{ fontSize: 13, color: 'var(--color-ink-faint)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 14, color: 'var(--color-ink)' }}>{value}</span>
    </div>
  )
}
