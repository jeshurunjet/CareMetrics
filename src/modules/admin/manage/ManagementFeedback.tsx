"use client"
import { useSearchParams } from "next/navigation"
import { Panel } from "../ui/core"
export function Confirmation() {
  const query = useSearchParams()
  return query.get("saved") === "1" ? (
    <p role="status" className="cm-hint">
      Changes saved to PostgreSQL.
    </p>
  ) : null
}
export function Deferred() {
  return (
    <Panel title="Future Development">
      <p>
        This service is unavailable. No operational or care record is written.
      </p>
    </Panel>
  )
}
