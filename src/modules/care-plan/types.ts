import type { ConfigurableFormVersion, FormValues } from "../forms/types"
export interface PublishedVersionInfo {
  version: number
  name: string
  publishedAt: string
}
export interface CareCategory {
  id: string
  name: string
  version: number | null
  active: boolean
  archived: boolean
  available: boolean
  message: string
  count: number
  lastSubmittedAt: string | null
  publishedVersions: PublishedVersionInfo[]
}
export interface CareFormRead {
  clientId: string
  clientName: string
  houseId: string
  houseName: string
  templateId: string
  templateName: string
  form: ConfigurableFormVersion
  authorName: string
  now: string
  offShift: boolean
}
export interface CareRecordRead {
  id: string
  clientId: string
  templateId: string
  templateName: string
  templateVersion: number
  form: ConfigurableFormVersion
  values: FormValues
  authorId: string
  authorName: string
  houseId: string | null
  houseName: string | null
  coveredAt: string
  createdAt: string
  submittedAt: string
  offShiftReason: string | null
}
export interface CarePageRead {
  categories: CareCategory[]
  rows: CareRecordRead[]
  detail: CareRecordRead | null
  selected: CareCategory | null
  publishedForm: ConfigurableFormVersion | null
  total: number
  page: number
  per: number
  filters: Record<string, string>
}
