import Link from "next/link"
import { Banner, Empty } from "../ui"
import { careListHref } from "./navigation"
export function AssessmentPreviewNotice({
  kind = "care",
}: {
  kind?: "care" | "chart"
}) {
  return (
    <Banner tone="info">
      Development {kind === "chart" ? "chart entry" : "assessment"} · fictional
      demonstration forms, not clinical standards. Changes last only while
      navigating this preview; reload resets them. Nothing is saved to a server.
    </Banner>
  )
}
export function UnavailableAssessment({
  clientId,
  kind = "care",
}: {
  clientId: string
  kind?: "care" | "chart"
}) {
  return (
    <Empty
      icon="shield"
      title={
        kind === "chart" ? "Chart entry unavailable" : "Assessment unavailable"
      }
      text="This template or record is not available for the selected client. Reloading removes session-only demonstration records."
      action={
        <Link href={careListHref(clientId, kind)}>
          Back to {kind === "chart" ? "Charting" : "Care Plan"}
        </Link>
      }
    />
  )
}
