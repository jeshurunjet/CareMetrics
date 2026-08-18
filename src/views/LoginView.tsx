import { useState } from 'react'
import type { Role } from '../types/domain'

type Screen = 'login' | 'forgot' | 'reset' | 'expired'

interface Props {
  onLogin: (role: Role) => void
}

export default function LoginView({ onLogin }: Props) {
  const [screen, setScreen] = useState<Screen>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [forgotSent, setForgotSent] = useState(false)

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { setError('Please enter your email and password.'); return }
    if (password === 'admin') { onLogin('manager'); return }
    if (password === 'staff') { onLogin('employee'); return }
    setError('Incorrect email or password. Please try again.')
  }

  function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    if (!email) { setError('Please enter your email address.'); return }
    setForgotSent(true)
    setError('')
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', fontFamily: 'var(--font-sans)' }}>
      {/* Left panel */}
      <div style={{ width: 480, background: '#0f1e2a', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px 48px', flexShrink: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 60 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--color-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'white' }}>CareMetrics</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.7, maxWidth: 340 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'white', marginBottom: 16, lineHeight: 1.2 }}>Disability support,<br/>thoughtfully managed.</div>
            CareMetrics helps disability support organisations manage their workforce, houses, clients, and care documentation — all in one place.
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>© 2026 CareMetrics · All rights reserved</div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 400, background: 'white', borderRadius: 16, padding: '40px 40px', boxShadow: '0 4px 32px rgba(0,0,0,0.06)', border: '1px solid var(--color-border)' }}>

          {screen === 'login' && (
            <>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, margin: '0 0 6px', color: 'var(--color-ink)' }}>Welcome back</h2>
              <p style={{ fontSize: 14, color: 'var(--color-ink-faint)', margin: '0 0 28px' }}>Sign in to your account to continue.</p>
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field label="Email address">
                  <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError('') }} placeholder="you@organisation.nz" style={inputStyle} />
                </Field>
                <Field label="Password">
                  <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError('') }} placeholder="••••••••" style={inputStyle} />
                </Field>
                {error && <div style={{ background: '#fce8e8', border: '1px solid rgba(220,53,69,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc3545' }}>{error}</div>}
                <button type="submit" style={btnPrimary}>Sign in</button>
                <button type="button" onClick={() => { setScreen('forgot'); setError('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--color-brand)', textDecoration: 'underline', alignSelf: 'center', marginTop: -4 }}>
                  Forgot your password?
                </button>
              </form>
              <div style={{ marginTop: 28, padding: '14px 16px', background: 'var(--color-surface)', borderRadius: 10, fontSize: 12, color: 'var(--color-ink-muted)', lineHeight: 1.6 }}>
                <strong>Demo:</strong> Use <code style={{ background: 'rgba(0,0,0,0.06)', padding: '1px 5px', borderRadius: 4 }}>admin</code> for manager view, <code style={{ background: 'rgba(0,0,0,0.06)', padding: '1px 5px', borderRadius: 4 }}>staff</code> for employee view.
              </div>
            </>
          )}

          {screen === 'forgot' && !forgotSent && (
            <>
              <button onClick={() => { setScreen('login'); setError('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--color-ink-muted)', marginBottom: 20, padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                Back to sign in
              </button>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400, margin: '0 0 6px', color: 'var(--color-ink)' }}>Reset your password</h2>
              <p style={{ fontSize: 14, color: 'var(--color-ink-faint)', margin: '0 0 24px' }}>Enter your email address and we'll send you a link to reset your password.</p>
              <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field label="Email address">
                  <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError('') }} placeholder="you@organisation.nz" style={inputStyle} />
                </Field>
                {error && <div style={{ background: '#fce8e8', border: '1px solid rgba(220,53,69,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc3545' }}>{error}</div>}
                <button type="submit" style={btnPrimary}>Send reset link</button>
              </form>
            </>
          )}

          {screen === 'forgot' && forgotSent && (
            <>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#e6f7f1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2a9d6f" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400, margin: '0 0 10px', color: 'var(--color-ink)' }}>Check your inbox</h2>
              <p style={{ fontSize: 14, color: 'var(--color-ink-muted)', lineHeight: 1.6, margin: '0 0 24px' }}>We've sent a password reset link to <strong>{email}</strong>. If you don't see it, check your spam folder.</p>
              <button onClick={() => { setScreen('login'); setForgotSent(false) }} style={btnPrimary}>Back to sign in</button>
            </>
          )}

          {screen === 'reset' && (
            <>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400, margin: '0 0 6px', color: 'var(--color-ink)' }}>Set a new password</h2>
              <p style={{ fontSize: 14, color: 'var(--color-ink-faint)', margin: '0 0 24px' }}>Choose a strong password for your account.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field label="New password"><input type="password" placeholder="••••••••" style={inputStyle} /></Field>
                <Field label="Confirm password"><input type="password" placeholder="••••••••" style={inputStyle} /></Field>
                <button style={btnPrimary} onClick={() => setScreen('login')}>Set password & sign in</button>
              </div>
            </>
          )}

          {screen === 'expired' && (
            <>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fce8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc3545" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400, margin: '0 0 10px', color: 'var(--color-ink)' }}>Link expired</h2>
              <p style={{ fontSize: 14, color: 'var(--color-ink-muted)', lineHeight: 1.6, margin: '0 0 24px' }}>This password reset link has expired or has already been used. Request a new one below.</p>
              <button onClick={() => { setScreen('forgot'); setForgotSent(false) }} style={btnPrimary}>Request a new link</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-ink)', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 9, border: '1.5px solid var(--color-border)',
  fontSize: 14, color: 'var(--color-ink)', outline: 'none', background: 'var(--color-surface)',
  boxSizing: 'border-box', fontFamily: 'var(--font-sans)',
}

const btnPrimary: React.CSSProperties = {
  padding: '12px 20px', borderRadius: 10, border: 'none', background: 'var(--color-brand)',
  color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 700, width: '100%',
}
