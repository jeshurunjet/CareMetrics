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
