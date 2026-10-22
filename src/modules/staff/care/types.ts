import type { ConfigurableFormVersion, FormValues } from "@/modules/forms/types"
export interface CareTemplate {
  id: string
  kind: "care" | "chart"
  name: string
  description: string
  documentationOnly?: boolean
  versions: readonly ConfigurableFormVersion[]
}
export interface ClientCareTemplateAssignment {
  clientId: string
  templateId: string
  version: number
  status: "active" | "paused"
}
export interface CareRecord {
  id: string
  clientId: string
  templateId: string
  templateVersion: number
  authorId: string
  values: FormValues
  coveredAt: string
  createdAt: string
  submittedAt?: string
  status: "draft" | "submitted" | "corrected"
  offShiftReason?: string
}
export interface CareRecordInput {
  values: FormValues
  coveredAt: string
  offShiftReason: string
}
