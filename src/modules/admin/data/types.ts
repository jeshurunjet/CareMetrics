export interface EmployeeInput {
  first: string
  last: string
  preferred: string
  employeeId: string
  email: string
  phone: string
  address: string
  emergency: string
  role: string
  status: string
  started: string
  houses: string[]
}
export interface HouseInput {
  name: string
  code: string
  address: string
  suburb: string
  phone: string
  email: string
  description: string
  manager: string
  status: string
  lat: string
  lng: string
  geofence: string
}
export interface ClientInput {
  first: string
  last: string
  preferred: string
  dob: string
  ref: string
  nhi: string
  houseId: string
  summary: string
  status: string
  alerts: string
}
export type Errors = Record<string, string>
