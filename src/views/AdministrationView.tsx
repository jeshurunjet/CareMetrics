import { useState } from 'react'

const ROLES = [
  {
    id: 'admin', name: 'Administrator', description: 'Full access to all features including organisation settings, roles, and user management.',
    users: ['Admin Console'],
    permissions: ['Dashboard', 'Employees', 'Attendance', 'Leave', 'Rostering', 'Houses', 'Clients', 'Care Records', 'Care Management', 'Reports', 'Notifications', 'Administration', 'Role Management'],
  },
  {
    id: 'manager', name: 'Manager', description: 'Manages day-to-day operations. Can view and edit most records but cannot change organisation settings or roles.',
    users: ['Priya Sharma', 'Daniel Park'],
    permissions: ['Dashboard', 'Employees', 'Attendance', 'Leave', 'Rostering', 'Houses', 'Clients', 'Care Records', 'Care Management', 'Reports', 'Notifications'],
  },
  {
    id: 'team_leader', name: 'Team Leader', description: 'Can manage staff in their assigned house, approve leave, and review attendance. Cannot manage other houses.',
    users: ['Aroha Ngata'],
    permissions: ['Dashboard', 'Attendance (own house)', 'Leave (own house)', 'Rostering (view)', 'Clients (own house)', 'Care Records (own house)', 'Notifications'],
  },
  {
    id: 'support_worker', name: 'Support Worker', description: 'Personal dashboard with clock-in, care recording, and access to assigned clients only.',
    users: ['Jamie Taufa', 'Sam Wilson', 'Lena Costa', 'Marcus Bell', "Grace Tūhoe"],
    permissions: ['Personal Dashboard', 'My Roster', 'My Attendance', 'My Leave', 'Assigned Clients', 'Care Recording', 'Notifications (personal)', 'My Profile'],
  },
]

const ORG_SETTINGS = [
  { group: 'Organisation Details', fields: [
    { label: 'Organisation Name', value: 'CareFirst Support Services', type: 'text' },
    { label: 'Registration Number', value: 'NZ-DSS-2019-001', type: 'text' },
    { label: 'Primary Contact', value: 'admin@carefirst.nz', type: 'email' },
    { label: 'Phone', value: '09 555 0100', type: 'tel' },
  ]},
  { group: 'Attendance Settings', fields: [
    { label: 'Late Arrival Grace Period (minutes)', value: '5', type: 'number' },
    { label: 'Geofence Radius (metres)', value: '150', type: 'number' },
    { label: 'Require Location for Clock-in', value: 'Yes', type: 'select' },
  ]},
  { group: 'Leave Settings', fields: [
    { label: 'Annual Leave Entitlement (days)', value: '20', type: 'number' },
    { label: 'Sick Leave Entitlement (days)', value: '10', type: 'number' },
    { label: 'Leave Approval Workflow', value: 'Manager Approval Required', type: 'select' },
  ]},
]

type Tab = 'roles' | 'org' | 'care'

export default function AdministrationView() {
  const [activeTab, setActiveTab] = useState<Tab>('roles')
  const [expandedRole, setExpandedRole] = useState<string | null>('admin')
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, margin: '0 0 4px', color: 'var(--color-ink)' }}>Administration</h1>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--color-ink-faint)' }}>Manage roles, permissions, and organisation settings.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 24, background: 'white', borderRadius: 10, padding: 4, border: '1px solid var(--color-border)', alignSelf: 'flex-start', width: 'fit-content' }}>
        {([['roles', 'Roles & Permissions'], ['org', 'Organisation Settings'], ['care', 'Care Configuration']] as [Tab, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{ padding: '7px 18px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === id ? 700 : 400, background: activeTab === id ? 'var(--color-brand)' : 'transparent', color: activeTab === id ? 'white' : 'var(--color-ink-muted)', transition: 'all 0.12s' }}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'roles' && (
        <div>
          <p style={{ fontSize: 14, color: 'var(--color-ink-muted)', marginBottom: 20, lineHeight: 1.5 }}>
            Roles determine what each user can see and do in CareMetrics. Users are assigned a role when their account is created. Contact your CAREMetrics administrator to request a custom role.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {ROLES.map(role => (
              <div key={role.id} style={{ background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                <button onClick={() => setExpandedRole(expandedRole === role.id ? null : role.id)} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 22px', width: '100%', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--color-brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 2 }}>{role.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--color-ink-faint)' }}>{role.users.length} user{role.users.length !== 1 ? 's' : ''}</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-faint)" strokeWidth="2" strokeLinecap="round" style={{ transform: expandedRole === role.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                {expandedRole === role.id && (
                  <div style={{ padding: '0 22px 20px', borderTop: '1px solid var(--color-border)' }}>
                    <p style={{ fontSize: 13, color: 'var(--color-ink-muted)', margin: '16px 0 14px', lineHeight: 1.5 }}>{role.description}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-ink-faint)', marginBottom: 10 }}>Access</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {role.permissions.map(p => (
                            <span key={p} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: '#e6f3f5', color: 'var(--color-brand)', fontWeight: 600 }}>{p}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-ink-faint)', marginBottom: 10 }}>Users with this role</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {role.users.map(u => (
                            <div key={u} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <Avatar name={u} size={28} />
                              <span style={{ fontSize: 13, color: 'var(--color-ink)' }}>{u}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'org' && (
        <div style={{ maxWidth: 640 }}>
          {saved && (
            <div style={{ background: '#e6f7f1', border: '1px solid rgba(42,157,111,0.2)', borderRadius: 10, padding: '12px 18px', marginBottom: 18, fontSize: 13, color: '#2a9d6f', fontWeight: 600 }}>
              ✓ Settings saved successfully.
            </div>
          )}
          {ORG_SETTINGS.map(section => (
            <div key={section.group} style={{ background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)', fontSize: 13, fontWeight: 700, color: 'var(--color-ink)' }}>{section.group}</div>
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {section.fields.map(f => (
                  <div key={f.label} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'center' }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)' }}>{f.label}</label>
                    {f.type === 'select' ? (
                      <select defaultValue={f.value} style={inputStyle}><option>{f.value}</option></select>
                    ) : (
                      <input type={f.type} defaultValue={f.value} style={inputStyle} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button onClick={handleSave} style={btnPrimary}>Save Settings</button>
        </div>
      )}

      {activeTab === 'care' && (
        <div>
          <p style={{ fontSize: 14, color: 'var(--color-ink-muted)', marginBottom: 20, lineHeight: 1.5 }}>
            Care templates define the configurable care sections used throughout CareMetrics. Manage templates in the <strong>Care Management</strong> section.
          </p>
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', padding: '22px 24px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 14 }}>Care Recording Settings</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Require notes for every care record', value: false },
                { label: 'Alert manager when care record is overdue', value: true },
                { label: 'Allow employees to edit submitted records', value: false },
                { label: 'Allow care records when not clocked in', value: false },
              ].map((s, i) => (
                <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
                  <input type="checkbox" defaultChecked={s.value} />
                  <span style={{ fontSize: 14, color: 'var(--color-ink)' }}>{s.label}</span>
                </label>
              ))}
            </div>
            <div style={{ marginTop: 20 }}>
              <button style={btnPrimary} onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2)
  const hue = name.charCodeAt(0) * 7 % 360
  return <div style={{ width: size, height: size, borderRadius: '50%', background: `hsl(${hue},45%,55%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, color: 'white', flexShrink: 0 }}>{initials}</div>
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13, color: 'var(--color-ink)', outline: 'none', background: 'white', boxSizing: 'border-box', fontFamily: 'var(--font-sans)' }
const btnPrimary: React.CSSProperties = { padding: '9px 20px', borderRadius: 9, border: 'none', background: 'var(--color-brand)', color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 700 }
