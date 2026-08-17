import { useState } from 'react'

const HOUSES = [
  { id: 1, name: 'Sunrise House', location: '12 Kowhai Ave, Manurewa, Auckland', status: 'active', employees: 6, clients: 4, manager: 'Priya Sharma', phone: '09 234 5678', type: 'Residential', capacity: 5 },
  { id: 2, name: 'Oaklands Service', location: '34 Rata St, Papakura, Auckland', status: 'active', employees: 4, clients: 3, manager: 'Daniel Park', phone: '09 345 6789', type: 'Day Service', capacity: 8 },
  { id: 3, name: 'Riverside Lodge', location: '88 Rimu Rd, Takanini, Auckland', status: 'active', employees: 5, clients: 4, manager: 'Aroha Ngata', phone: '09 456 7890', type: 'Residential', capacity: 5 },
  { id: 4, name: 'Cedar Hill', location: '7 Totara Pl, Manukau, Auckland', status: 'inactive', employees: 2, clients: 0, manager: 'Unassigned', phone: '—', type: 'Residential', capacity: 4 },
]

const STATUS_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  active: { label: 'Active', bg: '#e6f7f1', color: '#2a9d6f' },
  inactive: { label: 'Inactive', bg: 'var(--color-surface)', color: 'var(--color-ink-faint)' },
}

const HOUSE_EMPLOYEES: Record<number, { name: string; role: string; status: string }[]> = {
  1: [
    { name: 'Aroha Ngata', role: 'Senior Support Worker', status: 'active' },
    { name: 'Priya Sharma', role: 'Team Leader', status: 'active' },
    { name: 'Marcus Bell', role: 'Support Worker', status: 'on-leave' },
  ],
  2: [
    { name: 'Lena Costa', role: 'Support Worker', status: 'active' },
    { name: 'Marcus Bell', role: 'Support Worker', status: 'on-leave' },
  ],
  3: [
    { name: 'Jamie Taufa', role: 'Support Worker', status: 'active' },
    { name: "Grace Tūhoe", role: 'Support Worker', status: 'active' },
  ],
  4: [
    { name: 'Daniel Park', role: 'House Manager', status: 'active' },
    { name: 'Sam Wilson', role: 'Support Worker', status: 'late' },
  ],
}

const HOUSE_CLIENTS: Record<number, { name: string; plan: string }[]> = {
  1: [{ name: 'George Henare', plan: 'NDIS' }, { name: 'Sandra Parata', plan: 'DSS' }],
  2: [{ name: 'Mark Fletcher', plan: 'NDIS' }, { name: 'Annie Xu', plan: 'NDIS' }],
  3: [{ name: 'Peter Tumai', plan: 'NDIS' }, { name: 'Grace Williams', plan: 'DSS' }, { name: 'Tom Ngatai', plan: 'NDIS' }],
  4: [],
}

const EMP_STATUS: Record<string, { bg: string; color: string; label: string }> = {
  active: { label: 'Active', bg: '#e6f7f1', color: '#2a9d6f' },
  'on-leave': { label: 'On Leave', bg: '#e6f0fd', color: '#3b82f6' },
  late: { label: 'Late', bg: '#fff3e0', color: '#d97706' },
}

type Mode = 'list' | 'detail' | 'add'

export default function HousesView() {
  const [mode, setMode] = useState<Mode>('list')
  const [selected, setSelected] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [search, setSearch] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  const house = HOUSES.find(h => h.id === selected)

  const filtered = HOUSES.filter(h =>
    !search || h.name.toLowerCase().includes(search.toLowerCase()) || h.location.toLowerCase().includes(search.toLowerCase())
  )

  if (mode === 'add') return <AddHouseForm onBack={() => setMode('list')} />

  if (mode === 'detail' && house) return (
    <HouseDetail
      house={house}
      employees={HOUSE_EMPLOYEES[house.id] ?? []}
      clients={HOUSE_CLIENTS[house.id] ?? []}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      showConfirm={showConfirm}
      setShowConfirm={setShowConfirm}
      onBack={() => setMode('list')}
      onEdit={() => setMode('add')}
    />
  )

  return (
    <div style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, margin: '0 0 4px', color: 'var(--color-ink)' }}>Houses / Services</h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--color-ink-faint)' }}>{HOUSES.filter(h => h.status === 'active').length} active · {HOUSES.length} total</p>
        </div>
        <button onClick={() => setMode('add')} style={btnPrimary}>+ Add House</button>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'white', border: '1px solid var(--color-border)', borderRadius: 10, padding: '9px 14px', marginBottom: 20, width: 320 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-faint)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search houses…" style={{ border: 'none', outline: 'none', fontSize: 14, background: 'transparent', color: 'var(--color-ink)', width: '100%' }} />
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Houses', value: HOUSES.length, color: 'var(--color-brand)' },
          { label: 'Active', value: HOUSES.filter(h => h.status === 'active').length, color: '#2a9d6f' },
          { label: 'Staff Assigned', value: HOUSES.reduce((a, h) => a + h.employees, 0), color: '#d97706' },
          { label: 'Clients Supported', value: HOUSES.reduce((a, h) => a + h.clients, 0), color: '#7c3aed' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'white', borderRadius: 12, padding: '18px 20px', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: 'var(--font-display)' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--color-ink-faint)', marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState message="No houses match your search." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filtered.map(h => {
            const st = STATUS_STYLE[h.status]
            return (
              <button key={h.id} onClick={() => { setSelected(h.id); setActiveTab('overview'); setMode('detail') }} style={{ background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', padding: '20px 22px', textAlign: 'left', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-ink)' }}>{h.name}</div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: st.bg, color: st.color }}>{st.label}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-ink-faint)', marginBottom: 14 }}>📍 {h.location}</div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <Stat label="Staff" value={h.employees} />
                  <Stat label="Clients" value={h.clients} />
                  <Stat label="Type" value={h.type} />
                </div>
                <div style={{ marginTop: 14, borderTop: '1px solid var(--color-border)', paddingTop: 12, fontSize: 12, color: 'var(--color-ink-faint)' }}>
                  Manager: <strong style={{ color: 'var(--color-ink)' }}>{h.manager}</strong>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function HouseDetail({ house, employees, clients, activeTab, setActiveTab, showConfirm, setShowConfirm, onBack, onEdit }: {
  house: typeof HOUSES[0], employees: typeof HOUSE_EMPLOYEES[1], clients: typeof HOUSE_CLIENTS[1],
  activeTab: string, setActiveTab: (t: string) => void, showConfirm: boolean, setShowConfirm: (v: boolean) => void,
  onBack: () => void, onEdit: () => void
}) {
  const tabs = ['overview', 'employees', 'clients', 'roster', 'alerts', 'activity']

  return (
    <div style={{ padding: 32 }}>
      {/* Back + actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-ink-muted)', fontSize: 13, padding: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Houses
        </button>
        <span style={{ color: 'var(--color-border)' }}>/</span>
        <span style={{ fontSize: 13, color: 'var(--color-ink)', fontWeight: 600 }}>{house.name}</span>
        <div style={{ flex: 1 }} />
        <button onClick={onEdit} style={{ ...btnOutline }}>Edit House</button>
        <button onClick={() => setShowConfirm(true)} style={{ ...btnDanger }}>Deactivate</button>
      </div>

      {/* Header card */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', padding: '24px 28px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400, margin: '0 0 4px', color: 'var(--color-ink)' }}>{house.name}</h2>
            <div style={{ fontSize: 14, color: 'var(--color-ink-faint)' }}>📍 {house.location}</div>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, ...STATUS_STYLE[house.status] }}>{STATUS_STYLE[house.status].label}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, auto)', gap: '0 32px' }}>
          <Stat label="Type" value={house.type} />
          <Stat label="Capacity" value={house.capacity} />
          <Stat label="Staff" value={house.employees} />
          <Stat label="Clients" value={house.clients} />
        </div>
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--color-border)', display: 'flex', gap: 24, fontSize: 13, color: 'var(--color-ink-faint)' }}>
          <span>Manager: <strong style={{ color: 'var(--color-ink)' }}>{house.manager}</strong></span>
          <span>Phone: <strong style={{ color: 'var(--color-ink)' }}>{house.phone}</strong></span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, background: 'white', borderRadius: 10, padding: 4, border: '1px solid var(--color-border)', alignSelf: 'flex-start', width: 'fit-content' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{ padding: '6px 16px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === t ? 700 : 400, background: activeTab === t ? 'var(--color-brand)' : 'transparent', color: activeTab === t ? 'white' : 'var(--color-ink-muted)', textTransform: 'capitalize', transition: 'all 0.12s' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card title="Location">
            <div style={{ height: 200, background: 'linear-gradient(135deg, #e8f0f4, #d0e4ec)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, fontSize: 13, color: 'var(--color-ink-faint)' }}>
              📍 Map view
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-ink-muted)' }}>{house.location}</div>
          </Card>
          <Card title="Alerts">
            {house.status === 'active' ? (
              <AlertItem level="warning" msg="Sam Wilson clocked in 18 minutes late today" />
            ) : (
              <EmptyState message="No active alerts for this house." />
            )}
          </Card>
        </div>
      )}

      {activeTab === 'employees' && (
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          <TableHeader cols={['Employee', 'Role', 'Status']} />
          {employees.length === 0 ? <EmptyState message="No employees assigned." /> : employees.map((emp, i) => {
            const st = EMP_STATUS[emp.status] ?? EMP_STATUS.active
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: 16, padding: '14px 20px', borderBottom: i < employees.length - 1 ? '1px solid var(--color-border)' : 'none', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar name={emp.name} size={34} /><span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)' }}>{emp.name}</span></div>
                <span style={{ fontSize: 13, color: 'var(--color-ink-muted)' }}>{emp.role}</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: st.bg, color: st.color }}>{st.label}</span>
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'clients' && (
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          <TableHeader cols={['Client', 'Funding']} />
          {clients.length === 0 ? <EmptyState message="No clients assigned to this house." /> : clients.map((c, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 16, padding: '14px 20px', borderBottom: i < clients.length - 1 ? '1px solid var(--color-border)' : 'none', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar name={c.name} size={34} /><span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)' }}>{c.name}</span></div>
              <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: '#e6f3f5', color: 'var(--color-brand)' }}>{c.plan}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'roster' && (
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', padding: '20px', textAlign: 'center', color: 'var(--color-ink-faint)', fontSize: 14 }}>
          Upcoming roster for {house.name} — view full rostering in the Rostering section.
        </div>
      )}

      {activeTab === 'alerts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <AlertItem level="warning" msg="Sam Wilson clocked in 18 minutes late today" />
          <AlertItem level="info" msg="Roster for next week is not yet published" />
        </div>
      )}

      {activeTab === 'activity' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          {[
            { time: '08:04', desc: 'Jamie Taufa clocked in', user: 'System' },
            { time: '07:31', desc: 'Priya Sharma clocked in', user: 'System' },
            { time: '07:18', desc: 'Care record submitted for George Henare', user: 'Aroha Ngata' },
            { time: 'Yesterday', desc: 'Shift updated — Marcus Bell replaced by Aroha Ngata', user: 'Priya Sharma' },
          ].map((a, i, arr) => (
            <div key={i} style={{ padding: '14px 20px', borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-faint)', flexShrink: 0, width: 70 }}>{a.time}</span>
              <div>
                <div style={{ fontSize: 14, color: 'var(--color-ink)' }}>{a.desc}</div>
                <div style={{ fontSize: 12, color: 'var(--color-ink-faint)', marginTop: 2 }}>{a.user}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm modal */}
      {showConfirm && (
        <ConfirmModal
          title="Deactivate house?"
          message={`Deactivating ${house.name} will remove it from active operations. Staff and client assignments will be retained but the house will no longer appear in active views.`}
          confirmLabel="Deactivate"
          onConfirm={() => setShowConfirm(false)}
          onCancel={() => setShowConfirm(false)}
          danger
        />
      )}
    </div>
  )
}

function AddHouseForm({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ padding: 32, maxWidth: 680 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-ink-muted)', fontSize: 13, padding: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Houses
        </button>
      </div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400, margin: '0 0 6px', color: 'var(--color-ink)' }}>Add House / Service</h2>
      <p style={{ fontSize: 14, color: 'var(--color-ink-faint)', margin: '0 0 28px' }}>Fill in the details for the new house or service.</p>

      <FormSection title="Basic Information">
        <FormRow>
          <FormField label="House / Service Name"><input style={inputStyle} placeholder="e.g. Cedar Hill" /></FormField>
          <FormField label="Type"><select style={inputStyle}><option>Residential</option><option>Day Service</option><option>Supported Independent Living</option></select></FormField>
        </FormRow>
        <FormRow>
          <FormField label="Status"><select style={inputStyle}><option>Active</option><option>Inactive</option></select></FormField>
          <FormField label="Capacity"><input type="number" style={inputStyle} placeholder="e.g. 5" /></FormField>
        </FormRow>
      </FormSection>

      <FormSection title="Location">
        <FormField label="Street Address"><input style={inputStyle} placeholder="Street address" /></FormField>
        <FormRow>
          <FormField label="Suburb"><input style={inputStyle} placeholder="Suburb" /></FormField>
          <FormField label="City"><input style={inputStyle} placeholder="City" /></FormField>
        </FormRow>
      </FormSection>

      <FormSection title="Contact">
        <FormRow>
          <FormField label="Phone"><input style={inputStyle} placeholder="09 xxx xxxx" /></FormField>
          <FormField label="Manager"><select style={inputStyle}><option value="">Select manager…</option><option>Priya Sharma</option><option>Daniel Park</option><option>Aroha Ngata</option></select></FormField>
        </FormRow>
      </FormSection>

      <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
        <button style={btnPrimary} onClick={onBack}>Save House</button>
        <button style={btnOutline} onClick={onBack}>Cancel</button>
      </div>
    </div>
  )
}

// Shared helpers
function Stat({ label, value }: { label: string; value: string | number }) {
  return <div><div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>{value}</div><div style={{ fontSize: 11, color: 'var(--color-ink-faint)', marginTop: 2 }}>{label}</div></div>
}
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', padding: '20px 22px' }}><div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 14 }}>{title}</div>{children}</div>
}
function AlertItem({ level, msg }: { level: 'warning' | 'info' | 'danger'; msg: string }) {
  const styles = { warning: { bg: '#fff7e0', color: '#d97706', border: 'rgba(217,119,6,0.15)' }, info: { bg: '#e6f0fd', color: '#3b82f6', border: 'rgba(59,130,246,0.15)' }, danger: { bg: '#fce8e8', color: '#dc3545', border: 'rgba(220,53,69,0.15)' } }
  const s = styles[level]
  return <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'var(--color-ink)', lineHeight: 1.5 }}><span style={{ color: s.color, fontWeight: 700, marginRight: 6 }}>{level === 'warning' ? '⚠' : level === 'danger' ? '✕' : 'ℹ'}</span>{msg}</div>
}
function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2)
  const hue = name.charCodeAt(0) * 7 % 360
  return <div style={{ width: size, height: size, borderRadius: '50%', background: `hsl(${hue},45%,55%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, color: 'white', flexShrink: 0 }}>{initials}</div>
}
function TableHeader({ cols }: { cols: string[] }) {
  return <div style={{ display: 'grid', gridTemplateColumns: cols.map(() => '1fr').join(' '), gap: 16, padding: '11px 20px', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>{cols.map(c => <span key={c} style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-ink-faint)' }}>{c}</span>)}</div>
}
function EmptyState({ message }: { message: string }) {
  return <div style={{ padding: '40px 20px', textAlign: 'center', fontSize: 14, color: 'var(--color-ink-faint)' }}>{message}</div>
}
function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 24 }}><div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid var(--color-border)' }}>{title}</div>{children}</div>
}
function FormRow({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>{children}</div>
}
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-ink)', marginBottom: 5 }}>{label}</label>{children}</div>
}
function ConfirmModal({ title, message, confirmLabel, onConfirm, onCancel, danger = false }: { title: string; message: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void; danger?: boolean }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: 'white', borderRadius: 14, padding: '28px 32px', maxWidth: 440, width: '90%', boxShadow: '0 8px 40px rgba(0,0,0,0.16)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, margin: '0 0 10px', color: 'var(--color-ink)' }}>{title}</h3>
        <p style={{ fontSize: 14, color: 'var(--color-ink-muted)', lineHeight: 1.6, margin: '0 0 22px' }}>{message}</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onConfirm} style={{ flex: 1, padding: '11px', borderRadius: 9, border: 'none', cursor: 'pointer', background: danger ? 'var(--color-danger)' : 'var(--color-brand)', color: 'white', fontWeight: 700, fontSize: 14 }}>{confirmLabel}</button>
          <button onClick={onCancel} style={{ flex: 1, padding: '11px', borderRadius: 9, border: '1.5px solid var(--color-border)', cursor: 'pointer', background: 'white', color: 'var(--color-ink)', fontWeight: 600, fontSize: 14 }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 14, color: 'var(--color-ink)', outline: 'none', background: 'white', boxSizing: 'border-box', fontFamily: 'var(--font-sans)', marginBottom: 0 }
const btnPrimary: React.CSSProperties = { padding: '9px 20px', borderRadius: 9, border: 'none', background: 'var(--color-brand)', color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 700 }
const btnOutline: React.CSSProperties = { padding: '9px 20px', borderRadius: 9, border: '1.5px solid var(--color-border)', background: 'white', color: 'var(--color-ink)', cursor: 'pointer', fontSize: 14, fontWeight: 600 }
const btnDanger: React.CSSProperties = { padding: '9px 20px', borderRadius: 9, border: 'none', background: '#fce8e8', color: 'var(--color-danger)', cursor: 'pointer', fontSize: 14, fontWeight: 700 }
