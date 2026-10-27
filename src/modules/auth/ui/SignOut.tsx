"use client"
import { stopLiveLocation } from "@/modules/attendance/foreground-location"
import { signOut } from "next-auth/react"
import { useState } from "react"
export default function SignOut() {
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)
  return (
    <>
      <button
        className="cm-btn cm-btn--secondary cm-btn--md"
        disabled={busy}
        onClick={async () => {
          stopLiveLocation()
          setBusy(true)
          setError(false)
          try {
            await signOut({ redirectTo: "/login" })
          } catch {
            setError(true)
            setBusy(false)
          }
        }}
      >
        {busy ? "Signing out…" : "Sign out"}
      </button>
      {error && <p role="alert">Sign-out unavailable. Please retry.</p>}
    </>
  )
}
