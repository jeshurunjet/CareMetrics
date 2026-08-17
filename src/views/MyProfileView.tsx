import { useState } from 'react'

type Tab = 'personal' | 'employment' | 'account'

export default function MyProfileView() {
  const [activeTab, setActiveTab] = useState<Tab>('personal')
  const [editPersonal, setEditPersonal] = useState(false)
  const [editAccount, setEditAccount] = useState(false)
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setSaved(true)
    setEditPersonal(false)
    setEditAccount(false)
    setTimeout(() => setSaved(false), 2500)
  }

  const tabs: [Tab, string][] = [['personal', 'Personal Info'], ['employment', 'Employment'], ['account', 'Account']]

  return (
    <div style={{ padding: 32, maxWidth: 720 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #2d8fa0, #1a6b7a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700, color: 'white', flexShrink: 0 }}>JT</div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400, margin: '0 0 3px', color: 'var(--color-ink)' }}>Jamie Taufa</h1>
          <div style={{ fontSize: 14, color: 'var(--color-ink-faint)' }}>Support Worker · Riverside Lodge</div>
          <div style={{ fontSize: 12, color: 'var(--color-ink-faint)', marginTop: 2 }}>Employee since January 2024</div>
        </div>
      </div>

      {saved && (
        <div style={{ background: '#e6f7f1', border: '1px solid rgba(42,157,111,0.2)', borderRadius: 10, padding: '12px 18px', marginBottom: 18, fontSize: 13, color: '#2a9d6f', fontWeight: 600 }}>
          ✓ Changes saved successfully.
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 24, background: 'white', borderRadius: 10, padding: 4, border: '1px solid var(--color-border)', width: 'fit-content' }}>
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{ padding: '7px 18px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === id ? 700 : 400, background: activeTab === id ? 'var(--color-brand)' : 'transparent', color: activeTab === id ? 'white' : 'var(--color-ink-muted)', transition: 'all 0.12s' }}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'personal' && (
        <div>
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink)' }}>Personal Details</span>
              <button onClick={() => setEditPersonal(e => !e)} style={btnOutline}>{editPersonal ? 'Cancel' : 'Edit'}</button>
            </div>
            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <ProfileField label="First Name" value="Jamie" editing={editPersonal} />
              <ProfileField label="Last Name" value="Taufa" editing={editPersonal} />
              <ProfileField label="Date of Birth" value="12 March 1995" editing={editPersonal} />
              <ProfileField label="Gender" value="Male" editing={editPersonal} type="select" />
              <ProfileField label="Preferred Name" value="Jamie" editing={editPersonal} />
              <ProfileField label="Pronouns" value="He / Him" editing={editPersonal} />
            </div>
          </div>
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink)' }}>Contact Information</span>
              {!editPersonal && <button onClick={() => setEditPersonal(true)} style={btnOutline}>Edit</button>}
            </div>
            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <ProfileField label="Email" value="jamie.taufa@email.com" editing={editPersonal} type="email" />
              <ProfileField label="Phone" value="021 456 789" editing={editPersonal} type="tel" />
              <ProfileField label="Address" value="45 Huia St, Manurewa, Auckland" editing={editPersonal} />
              <ProfileField label="Emergency Contact" value="Ana Taufa — 021 555 0101" editing={editPersonal} />
            </div>
          </div>
          {editPersonal && <button onClick={handleSave} style={btnPrimary}>Save Changes</button>}
        </div>
      )}

      {activeTab === 'employment' && (
        <div>
          <div style={{ background: '#e6f3f5', border: '1px solid rgba(26,107,122,0.15)', borderRadius: 10, padding: '12px 18px', marginBottom: 16, fontSize: 13, color: 'var(--color-ink-muted)', lineHeight: 1.5 }}>
            <span style={{ color: 'var(--color-brand)', fontWeight: 700 }}>ℹ</span> Employment information is managed by your organisation. Contact your manager to request changes.
          </div>
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)', fontSize: 13, fontWeight: 700, color: 'var(--color-ink)' }}>Employment Details</div>
            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <ReadonlyField label="Role" value="Support Worker" />
              <ReadonlyField label="Employment Type" value="Full Time" />
              <ReadonlyField label="Start Date" value="8 January 2024" />
              <ReadonlyField label="Status" value="Active" badge green />
              <ReadonlyField label="Assigned House" value="Riverside Lodge" />
              <ReadonlyField label="Manager" value="Priya Sharma" />
            </div>
          </div>
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)', fontSize: 13, fontWeight: 700, color: 'var(--color-ink)' }}>Leave Balances</div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <LeaveBalance label="Annual Leave" used={5} total={20} color="var(--color-brand)" />
              <LeaveBalance label="Sick Leave" used={2} total={10} color="#d97706" />
              <LeaveBalance label="Public Holidays" used={0} total={12} color="#7c3aed" />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'account' && (
        <div>
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink)' }}>Login & Security</span>
              <button onClick={() => setEditAccount(e => !e)} style={btnOutline}>{editAccount ? 'Cancel' : 'Edit'}</button>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <ProfileField label="Email Address" value="jamie.taufa@email.com" editing={editAccount} type="email" />
              {editAccount && (
                <>
                  <ProfileField label="Current Password" value="" editing placeholder="Enter current password" type="password" />
                  <ProfileField label="New Password" value="" editing placeholder="Enter new password" type="password" />
                  <ProfileField label="Confirm New Password" value="" editing placeholder="Confirm new password" type="password" />
                </>
              )}
            </div>
          </div>
          {editAccount && <button onClick={handleSave} style={btnPrimary}>Update Account</button>}
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', overflow: 'hidden', marginTop: 16 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)', fontSize: 13, fontWeight: 700, color: 'var(--color-ink)' }}>Preferences</div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {['Email me when my leave request status changes', 'Email me when a new shift is assigned', 'Receive in-app notifications for client alerts'].map((pref, i) => (
                <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontSize: 14, color: 'var(--color-ink)' }}>
                  <input type="checkbox" defaultChecked={i < 2} />
                  {pref}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ProfileField({ label, value, editing, type = 'text', placeholder }: { label: string; value: string; editing: boolean; type?: string; placeholder?: string }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-ink-faint)', marginBottom: 5 }}>{label}</label>
      {editing ? (
        type === 'select' ? (
          <select defaultValue={value} style={inputStyle}><option>{value}</option></select>
        ) : (
          <input type={type} defaultValue={value} placeholder={placeholder} style={inputStyle} />
        )
      ) : (
        <div style={{ fontSize: 14, color: 'var(--color-ink)', padding: '2px 0' }}>{value || '—'}</div>
      )}
    </div>
  )
}

function ReadonlyField({ label, value, badge = false, green = false }: { label: string; value: string; badge?: boolean; green?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-ink-faint)', marginBottom: 5 }}>{label}</div>
      {badge ? (
        <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: green ? '#e6f7f1' : 'var(--color-surface)', color: green ? '#2a9d6f' : 'var(--color-ink-faint)' }}>{value}</span>
      ) : (
        <div style={{ fontSize: 14, color: 'var(--color-ink)' }}>{value}</div>
      )}
    </div>
  )
}

function LeaveBalance({ label, used, total, color }: { label: string; used: number; total: number; color: string }) {
  const pct = Math.round((used / total) * 100)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)' }}>{label}</span>
        <span style={{ fontSize: 13, color: 'var(--color-ink-muted)' }}>{used} of {total} days used</span>
      </div>
      <div style={{ height: 6, background: 'var(--color-surface)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.4s' }} />
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 14, color: 'var(--color-ink)', outline: 'none', background: 'white', boxSizing: 'border-box', fontFamily: 'var(--font-sans)' }
const btnPrimary: React.CSSProperties = { padding: '9px 20px', borderRadius: 9, border: 'none', background: 'var(--color-brand)', color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 700 }
const btnOutline: React.CSSProperties = { padding: '7px 16px', borderRadius: 8, border: '1.5px solid var(--color-border)', background: 'white', color: 'var(--color-ink)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }
