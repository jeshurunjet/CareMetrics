export interface HouseSummary {
  id: string
  name: string
  address: string
  phone?: string | null
  email?: string | null
  photo?: string
  clientCount: number
}
export interface ClientSummary {
  id: string
  houseId: string
  name: string
  preferred: string
  houseName: string
}
export interface EmployeeIdentity {
  id: string
  name: string
  role: string
  roleCode: string
  employeeId: string
  email: string
  status: "Active" | "Inactive" | "Invited"
  assignedHouses: {
    id: string
    name: string
  }[]
}
export interface ContactRead {
  id: string
  name: string
  relation: string
  phone?: string
  email?: string
  primary?: boolean
  emergency?: boolean
  notes?: string
}
export interface ClientProfileRead extends ClientSummary {
  dob?: string
  summary?: string
  contacts: ContactRead[]
}
export interface StaffOverview {
  employee: EmployeeIdentity
  houses: HouseSummary[]
  clients: ClientSummary[]
}
export interface StaffSearch {
  query: string
  houses: Array<HouseSummary & { clientNames: string[] }>
  clients: ClientSummary[]
}
