export interface DiaryRecord {
  id: string
  clientId: string
  houseId: string
  houseName: string
  authorId: string
  authorName: string
  title: string
  category: string
  categoryKey: string | null
  content: string
  coveredAt: string
  submittedAt: string
  createdAt: string
  offShiftReason: string | null
}
export interface DiaryHistory {
  rows: DiaryRecord[]
  total: number
  page: number
  per: number
  detail: DiaryRecord | null
  filters: Record<string, string>
}
export interface DiaryClient {
  id: string
  name: string
  houseId: string
  houseName: string
}
export interface DiaryEditor {
  client: DiaryClient
  authorName: string
  now: string
  offShift: boolean
}
