"use client"

/** Server HTML starts shielded, including streamed siblings, until this document checks its session. */
// Login is public. Every restored protected document must recheck revocation before unmasking.

import { useEffect, useState } from "react"
import { flushSync } from "react-dom"
export default function OnlineOnly({
  children,
}: {
  children: React.ReactNode
}) {
  const [unavailable, setUnavailable] = useState(false)
  useEffect(() => {
    let active = true
    const shield = () => {
      document.body.style.visibility = "hidden"
    }
    const offline = () => {
      shield()
      setUnavailable(true)
    }
    const verify = async () => {
      shield()
      if (!navigator.onLine) {
        setUnavailable(true)
        return
      }
      try {
        if (window.location.pathname !== "/login") {
          const response = await fetch("/api/me", {
            cache: "no-store",
            credentials: "same-origin",
          })
          if (!active) return
          if (response.status === 401) {
            window.location.replace("/login")
            return
          }
          if (!response.ok) throw new Error("Session unavailable")
        }
        if (active && navigator.onLine) {
          setUnavailable(false)
          document.body.style.visibility = "visible"
        } else if (active) setUnavailable(true)
      } catch {
        if (active) setUnavailable(true)
      }
    }
    const restored = (event: PageTransitionEvent) => {
      if (event.persisted) {
        shield()
        flushSync(() => setUnavailable(true))
        void verify()
      }
    }
    const online = () => window.location.reload()
    void verify()
    window.addEventListener("offline", offline)
    window.addEventListener("online", online)
    window.addEventListener("pagehide", shield)
    window.addEventListener("pageshow", restored)
    return () => {
      active = false
      window.removeEventListener("offline", offline)
      window.removeEventListener("online", online)
      window.removeEventListener("pagehide", shield)
      window.removeEventListener("pageshow", restored)
    }
  }, [])
  if (unavailable)
    return (
      <section
        className="cm-card cm-panel"
        role="alert"
        style={{ visibility: "visible" }}
      >
        <h1 className="cm-h3">Connection unavailable</h1>
        <p>
          CareMetrics requires an internet connection. Reconnect and reload to
          continue. Check history before retrying an uncertain submission.
        </p>
        <button
          className="cm-btn cm-btn--primary cm-btn--md"
          onClick={() => window.location.reload()}
        >
          Reload
        </button>
      </section>
    )
  return children
}
