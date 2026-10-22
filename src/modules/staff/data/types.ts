export interface Employee {
  id: string
  name: string
  role: string
  employeeId: string
  email: string
  photo?: string
}
export interface House {
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
  id: string
  staffId: string
  houseId: string
  start: string
  end: string
  assignedBy: string
}
export interface Notice {
  id: string
  category: "staff" | "house" | "client"
  title: string
  body?: string
  date: string
  publisher: string
  read: boolean
  relatedId?: string
  audience?: string
  status: "Published" | "Draft"
}
export interface StaffSnapshot {
  now: string
  meId: string
  staff: Employee[]
  houses: House[]
  assignments: HouseAssignment[]
  clients: Client[]
  shifts: Shift[]
  notices: Notice[]
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
  body: string
  coveredAt: string
  createdAt: string
  submittedAt?: string
  status: "draft" | "submitted" | "corrected"
  offShiftReason?: string
}
export interface CorrectionRequest {
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
