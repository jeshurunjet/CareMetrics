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
  lat: number
  lng: number
}
export interface HouseAssignment {
  employeeId: string
  houseId: string
}
export interface Client {
  id: string
  name: string
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
}
/** Future implementation must derive employee/scope from a trusted server session. */
export interface StaffReadService {
  getSnapshot(employeeId: string, now: string): StaffSnapshot
}
