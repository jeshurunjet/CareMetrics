import type { ConfigurableFormVersion, FormValues } from "@/modules/forms/types"
export interface TemplateDraft {
  name: string
  description: string
  form: ConfigurableFormVersion
  summary: string
  history?: CareTemplate["history"]
}
export interface CareTemplate {
  legacyMetadata?: {
    name: string
    description: string
  }
  draft?: TemplateDraft
  archived?: boolean
  createdAt?: string
  createdBy?: string
  updatedAt?: string
  updatedBy?: string
  id: string
  kind: "care" | "chart"
  name: string
  description: string
  history?: {
    columns: readonly string[]
    chart?: {
      fieldId: string
      unit: string
    }
  }
  documentationOnly?: boolean
  versions: readonly ConfigurableFormVersion[]
}
export interface ClientCareTemplateAssignment {
  clientId: string
  templateId: string
  version: number
  status: "active" | "paused"
  updatedAt?: string
  updatedBy?: string
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
