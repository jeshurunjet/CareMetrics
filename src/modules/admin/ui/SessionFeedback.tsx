"use client"
import { useSearchParams } from "next/navigation"
import { Banner } from "@/modules/staff/ui"
export default function SessionFeedback({ entity }: { entity: string }) {
  return useSearchParams().get("saved") === "1" ? (
    <Banner tone="info">
      {entity} saved in this development session only. Reload restores fixtures.
      No database write, real account provisioning or message delivery occurred.
    </Banner>
  ) : null
}
