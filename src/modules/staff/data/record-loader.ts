import "server-only"
import { notFound } from "next/navigation"
import { requirePreview } from "@/lib/require-preview"
import { developmentMockAdapter } from "./development-mock-adapter"
export function loadPreviewRecord(kind: "house" | "client", id: string) {
  requirePreview()
  const s = developmentMockAdapter.getSnapshot(
    "s1",
    process.env.CAREMETRICS_DEMO_NOW || new Date().toISOString(),
  )
  const record =
    kind === "house"
      ? developmentMockAdapter.getHouse(s, id)
      : developmentMockAdapter.getClient(s, id)
  if (!record) notFound()
  return record
}

export function loadPreviewCareTemplate(clientId: string, templateId: string) {
  requirePreview()
  const s = developmentMockAdapter.getSnapshot(
    "s1",
    process.env.CAREMETRICS_DEMO_NOW || new Date().toISOString(),
  )
  const assigned = developmentMockAdapter.getAssignedCareTemplate(
    s,
    clientId,
    templateId,
  )
  if (!assigned) notFound()
  return assigned
}
