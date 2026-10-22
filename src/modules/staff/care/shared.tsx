import Link from "next/link"
import { Banner, Empty } from "../ui"
import { careListHref } from "./navigation"
export function AssessmentPreviewNotice() {
  return (
    <Banner tone="info">
      Development assessment · fictional demonstration forms, not clinical
      standards. Changes last only while navigating this preview; reload resets
      them. Nothing is saved to a server.
    </Banner>
  )
}
export function UnavailableAssessment({ clientId }: { clientId: string }) {
  return (
    <Empty
      icon="shield"
      title="Assessment unavailable"
      text="This template or record is not available for the selected client. Reloading removes session-only demonstration records."
      action={<Link href={careListHref(clientId)}>Back to Care Plan</Link>}
    />
  )
}
