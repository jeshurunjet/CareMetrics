"use client" /* Left panel */ /* Right panel */
import { useState } from "react"
import type { PreviewRole as Role } from "@/modules/auth/types"

type Screen = "login" | "forgot"

interface Props {
  onLogin: (role: Role) => void
  previewEnabled: boolean
}

export default function LoginView({ onLogin, previewEnabled }: Props) {
  const [screen, setScreen] = useState<Screen>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!email.trim() || !password) {
      setError("Please enter your email and password.")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.")
      return
    }
    if (!previewEnabled) {
      setError(
        "Sign-in is not configured yet. No credentials have been submitted.",
      )
      return
    }
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 700))
    setPassword("")
    setLoading(false)
    onLogin("employee")
  }
  function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setError("Password recovery is not configured. No email has been sent.")
  }
  return (
    <div
      className="login-shell"
      style={{
        minHeight: "100dvh",
        display: "flex",
        fontFamily: "var(--font-sans)",
      }}
    >
      {}
      <div
        className="login-brand-panel"
        style={{
          width: 480,
          background: "#0f1e2a",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px 48px",
          flexShrink: 0,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 60,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                background: "var(--color-brand)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 22,
                color: "white",
              }}
            >
              CareMetrics
            </span>
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 13,
              lineHeight: 1.7,
              maxWidth: 340,
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 32,
                color: "white",
                marginBottom: 16,
                lineHeight: 1.2,
              }}
            >
              Disability support,
              <br />
              thoughtfully managed.
            </div>
            CareMetrics helps disability support organisations manage their
            workforce, houses, clients, and care documentation — all in one
            place.
          </div>
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
          © 2026 CareMetrics · All rights reserved
        </div>
      </div>

      {}
      <main
        className="login-main"
        style={{
          flex: 1,
          background: "var(--color-surface)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="login-mobile-brand" aria-label="CareMetrics">
          <div className="login-mobile-logo">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <span>CareMetrics</span>
        </div>

        <div
          className="login-card"
          style={{
            width: "100%",
            maxWidth: 400,
            background: "white",
            borderRadius: 16,
            padding: "40px 40px",
            boxShadow: "0 4px 32px rgba(0,0,0,0.06)",
            border: "1px solid var(--color-border)",
          }}
        >
          {screen === "login" && (
            <>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 28,
                  fontWeight: 400,
                  margin: "0 0 6px",
                  color: "var(--color-ink)",
                }}
              >
                Welcome back
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--color-ink-faint)",
                  margin: "0 0 28px",
                }}
              >
                Sign in to your account to continue.
              </p>
              <form
                onSubmit={handleLogin}
                noValidate
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <Field label="Email address" htmlFor="login-email">
                  <input
                    className="login-input"
                    id="login-email"
                    type="email"
                    autoComplete="off"
                    aria-required="true"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setError("")
                    }}
                    placeholder="you@organisation.nz"
                    style={inputStyle}
                  />
                </Field>
                <Field label="Password" htmlFor="login-password">
                  <div style={{ position: "relative" }}>
                    <input
                      className="login-input"
                      id="login-password"
                      type={showPw ? "text" : "password"}
                      autoComplete="off"
                      aria-required="true"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        setError("")
                      }}
                      placeholder="••••••••"
                      style={{ ...inputStyle, paddingRight: 48 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      aria-label={showPw ? "Hide password" : "Show password"}
                      aria-pressed={showPw}
                      style={{
                        position: "absolute",
                        right: 4,
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: 40,
                        height: 40,
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        color: "var(--color-ink-muted)",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      {showPw ? (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        >
                          <path d="M17.9 17.9A10 10 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.1-5.9M9.9 4.2A9 9 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.2 3.2M1 1l22 22" />
                        </svg>
                      ) : (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </Field>
                {error && (
                  <div
                    role="alert"
                    style={{
                      background: "#fce8e8",
                      border: "1px solid rgba(220,53,69,0.2)",
                      borderRadius: 8,
                      padding: "10px 14px",
                      fontSize: 13,
                      color: "#dc3545",
                    }}
                  >
                    {error}
                  </div>
                )}
                <button
                  className="login-primary-button"
                  type="submit"
                  disabled={loading}
                  style={{
                    ...btnPrimary,
                    opacity: loading ? 0.75 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {loading && (
                    <span className="cm-spinner" aria-hidden="true" />
                  )}
                  {loading ? "Signing in…" : "Sign in"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setScreen("forgot")
                    setError("")
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    color: "var(--color-brand)",
                    textDecoration: "underline",
                    alignSelf: "center",
                    marginTop: -4,
                  }}
                >
                  Forgot your password?
                </button>
              </form>
              <div
                style={{
                  marginTop: 28,
                  padding: "14px 16px",
                  background: "var(--color-surface)",
                  borderRadius: 10,
                  fontSize: 12,
                  color: "var(--color-ink-muted)",
                  lineHeight: 1.6,
                }}
              >
                <strong>UI ONLY:</strong>{" "}
                {previewEnabled
                  ? "Development mock session. Use any fictional email and non-empty password. No credentials are checked, stored or sent. Do not enter real credentials."
                  : "Authentication is not configured. Do not enter real credentials."}
                {previewEnabled && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      marginTop: 12,
                    }}
                  >
                    <button
                      type="button"
                      style={btnPrimary}
                      onClick={() => onLogin("admin")}
                    >
                      Preview administration
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {screen === "forgot" && (
            <>
              <button
                onClick={() => {
                  setScreen("login")
                  setError("")
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  color: "var(--color-ink-muted)",
                  marginBottom: 20,
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Back to sign in
              </button>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 26,
                  fontWeight: 400,
                  margin: "0 0 6px",
                  color: "var(--color-ink)",
                }}
              >
                Reset your password
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--color-ink-faint)",
                  margin: "0 0 24px",
                }}
              >
                Password recovery preview. Email delivery is not implemented.
              </p>
              <form
                onSubmit={handleForgot}
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <Field label="Email address" htmlFor="reset-email">
                  <input
                    className="login-input"
                    id="reset-email"
                    type="email"
                    autoComplete="off"
                    aria-required="true"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setError("")
                    }}
                    placeholder="you@organisation.nz"
                    style={inputStyle}
                  />
                </Field>
                {error && (
                  <div
                    role="alert"
                    style={{
                      background: "#fce8e8",
                      border: "1px solid rgba(220,53,69,0.2)",
                      borderRadius: 8,
                      padding: "10px 14px",
                      fontSize: 13,
                      color: "#dc3545",
                    }}
                  >
                    {error}
                  </div>
                )}
                <button
                  className="login-primary-button"
                  type="submit"
                  style={btnPrimary}
                >
                  Send reset link
                </button>
              </form>
            </>
          )}
        </div>
        <div className="login-mobile-footer">© 2026 CareMetrics</div>
      </main>
    </div>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 600,
          color: "var(--color-ink)",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 9,
  border: "1.5px solid var(--color-border)",
  fontSize: 14,
  color: "var(--color-ink)",
  outline: "none",
  background: "var(--color-surface)",
  boxSizing: "border-box",
  fontFamily: "var(--font-sans)",
}

const btnPrimary: React.CSSProperties = {
  padding: "12px 20px",
  borderRadius: 10,
  border: "none",
  background: "var(--color-brand)",
  color: "white",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 700,
  width: "100%",
}
