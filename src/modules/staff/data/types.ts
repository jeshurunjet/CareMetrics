import type {
  Concern,
  NotificationReadState,
  NoticePriority,
  NoticeAudience,
} from "../notifications/types"
import type { LeaveType, LeaveRequest, LeaveBalance } from "../leave/types"
import type {
  AttendanceRecord,
  AttendanceCorrectionRequest,
} from "../roster/types"
import type { FileRecord } from "../files/types"
import type {
  CareTemplate,
  ClientCareTemplateAssignment,
  CareRecord,
} from "../care/types"
export interface Employee {
  preferred?: string
  phone?: string
  address?: string
  emergency?: string
  started?: string
  status?: "Active" | "Inactive" | "Invited"
  id: string
  name: string
  role: string
  employeeId: string
  email: string
  photo?: string
}
export interface House {
  code?: string
  suburb?: string
  status?: "Active" | "Inactive"
  locationSet?: boolean
  geofence?: number | null
  id: string
  name: string
  address: string
  photo: string
  manager: string
  phone: string
  email?: string
  description?: string
  lat: number
  lng: number
}
export interface HouseAssignment {
  employeeId: string
  houseId: string
}
export interface ClientContact {
  address?: string
  id: string
  name: string
  relation: string
  phone?: string
  email?: string
  primary?: boolean
  emergency?: boolean
  notes?: string
}
export interface Client {
  ref?: string
  nhi?: string
  status?: "Active" | "Inactive"
  id: string
  name: string
  preferred: string
  dob?: string
  summary: string
  contacts: ClientContact[]
  houseId: string
  tone: string
  alerts: string[]
  photo?: string
}
export interface Shift {
  breakMins?: number
  assignedById?: string
  id: string
  staffId: string
  houseId: string
  start: string
  end: string
  assignedBy: string
  status?: "cancelled"
  notes?: string
}
export interface Notice {
  id: string
  category: "staff" | "house" | "client"
  title: string
  body?: string
  date: string
  publisher: string
  publisherId: string
  priority: NoticePriority
  targetAudience: NoticeAudience
  attachmentIds?: string[]
  relatedId?: string
  audience?: string
  createdById?: string
  createdAt?: string
  history?: Array<{
    id: string
    actorId: string
    actorName: string
    at: string
    action: "Draft saved" | "Published" | "Withdrawn"
    previous?: {
      title: string
      body?: string
      status: Notice["status"]
      targetAudience: NoticeAudience
      category: Notice["category"]
      relatedId?: string
      priority: NoticePriority
    }
  }>
  status: "Published" | "Draft" | "Withdrawn"
}
export interface Organisation {
  id: string
  name: string
}
export interface StaffSnapshot {
  organisation?: Organisation
  concerns: Concern[]
  notificationReads: NotificationReadState[]
  leaveTypes: LeaveType[]
  leaveRequests: LeaveRequest[]
  leaveBalances: LeaveBalance[]
  attendance: AttendanceRecord[]
  attendanceCorrections: AttendanceCorrectionRequest[]
  attachments: FileRecord[]
  now: string
  meId: string
  staff: Employee[]
  houses: House[]
  assignments: HouseAssignment[]
  clients: Client[]
  shifts: Shift[]
  notices: Notice[]
  careTemplates: CareTemplate[]
  careAssignments: ClientCareTemplateAssignment[]
  careRecords: CareRecord[]
  diary: DiaryEntry[]
  diaryCategories: DiaryCategory[]
  corrections: CorrectionRequest[]
  demoAttendance: {
    employeeId: string
    shiftId: string
  } | null
}
export interface HouseSearchResult {
  id: string
  name: string
  address: string
  photo: string
  clientNames: string[]
}
export interface ClientSearchResult {
  id: string
  name: string
  preferred: string
  houseId: string
  houseName: string
  tone: string
  photo?: string
}
export interface StaffSearchResults {
  houses: HouseSearchResult[]
  clients: ClientSearchResult[]
}
/** Future implementation must derive employee/scope from a trusted server session. */
export interface StaffReadService {
  getSnapshot(employeeId: string, now: string): StaffSnapshot
  getHouses(snapshot: StaffSnapshot): House[]
  getHouse(snapshot: StaffSnapshot, id: string): House | undefined
  getClients(snapshot: StaffSnapshot): Client[]
  getClientsByHouse(snapshot: StaffSnapshot, houseId: string): Client[]
  getClient(snapshot: StaffSnapshot, id: string): Client | undefined
  getClientContacts(snapshot: StaffSnapshot, clientId: string): ClientContact[]
  search(snapshot: StaffSnapshot, query: string): StaffSearchResults
}

export type DiaryScope = "client" | "house"
export interface DiarySubject {
  scope: DiaryScope
  targetId: string
}
export interface DiaryCategory {
  description?: string
  createdAt?: string
  createdBy?: string
  updatedAt?: string
  updatedBy?: string
  id: string
  name: string
  scope: DiaryScope
  active: boolean
}
export interface DiaryEntry extends DiarySubject {
  id: string
  authorId: string
  title: string
  categoryId: string
  categoryName?: string
  body: string
  coveredAt: string
  createdAt: string
  submittedAt?: string
  status: "draft" | "submitted" | "corrected"
  offShiftReason?: string
}
export interface CorrectionTarget {
  fieldId: string
  rowId?: string
  columnId?: string
}
export interface CorrectionRequest {
  baseRevisionId?: string
  proposal?: import("../documentation/revisions").CorrectionProposal
  decision?: {
    reviewerName?: string
    reviewerId: string
    at: string
    notes: string
    revision?: import("../documentation/revisions").RecordRevision
  }
  targets?: readonly CorrectionTarget[]
  recordType?: "diary" | "care"
  id: string
  recordId: string
  requestingEmployeeId: string
  reason: string
  proposed: string
  requestedAt: string
  status: "pending" | "approved" | "rejected"
}
export interface DiaryInput {
  title: string
  categoryId: string
  body: string
  coveredAt: string
  offShiftReason: string
}
