export type ManagementRole = "ADMINISTRATOR" | "MANAGER" | "SENIOR_STAFF" | "STAFF"
export type EmployeeCommand = {
  name: string
  employeeCode: string
  email: string
  role: ManagementRole
  status: "ACTIVE" | "INACTIVE" | "INVITED"
  houseIds: string[]
  expectedUpdatedAt?: string
}
export type HouseCommand = {
  name: string
  code: string
  address: string
  phone: string
  email: string
  active: boolean
  latitude: number | null
  longitude: number | null
  expectedUpdatedAt?: string
}
export type ClientCommand = {
  contacts?: ContactCommand[]
  confirmedRemovalIds?: string[]
  name: string
  preferredName: string
  reference: string
  dateOfBirth: string
  summary: string
  houseId: string
  active: boolean
  expectedUpdatedAt?: string
}
export type ContactCommand = {
  id?: string
  name: string
  relationship: string
  phone: string
  email: string
  isPrimary: boolean
  isEmergency: boolean
}
export type ContactsCommand = {
  contacts: ContactCommand[]
  confirmedRemovalIds: string[]
  expectedUpdatedAt: string
}
export interface AssignmentCommand {
  houseIds: string[]
  expectedUpdatedAt: string
}
export type TransferCommand = {
  houseId: string
  confirmed: boolean
  expectedUpdatedAt: string
}
export interface MutationResult {
  id: string
  updatedAt: string
}
export interface MutationFeedback {
  error: string
  fields?: Record<string, string>
}
