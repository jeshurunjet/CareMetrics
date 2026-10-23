"use client"
import { Btn } from "@/modules/staff/ui"
export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <section className="ad-panel ad-panel--pad" role="alert">
      <h1>Administration preview unavailable</h1>
      <p>
        The development view could not be loaded. No successful save is implied.
        Retry, or reload to restore fictional fixtures.
      </p>
      <Btn onClick={reset}>Retry view</Btn>
    </section>
  )
}
