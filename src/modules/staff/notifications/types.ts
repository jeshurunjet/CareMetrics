import type { FileSelectionMetadata } from "../files/types"
export type NoticeCategory = "client" | "house" | "staff"
export type NoticePriority = "Normal" | "Important" | "Urgent"
interface OrganisationAudience {
  kind: "organisation"
}
interface EmployeeAudience {
  kind: "employee"
  employeeId: string
}
interface HouseAudience {
  kind: "house"
  houseId: string
}
interface RoleAudience {
  kind: "role"
  role: string
}
export type NoticeAudience = OrganisationAudience | EmployeeAudience | HouseAudience | RoleAudience
interface ConcernResponse {
  reviewerName: string
  text: string
  at: string
}
export interface NotificationReadState {
  notificationId: string
  employeeId: string
  readAt: string
}
export type ConcernStatus = "Submitted" | "Under Review" | "Resolved" | "Closed"
export type ConcernPriority = "Low" | "Medium" | "High"
export interface Concern {
  id: string
  title: string
  description: string
  context: "client" | "house"
  targetId: string
  priority: ConcernPriority
  submittedById: string
  submittedAt: string
  status: ConcernStatus
  response?: ConcernResponse
  resolvedAt?: string
  attachmentIds?: string[]
}
export interface ConcernInput {
  title: string
  description: string
  context: string
  targetId: string
  priority: string
  attachment?: Pick<FileSelectionMetadata, "name" | "type" | "size">
}
