import type { Employee, House, Client } from "@/modules/staff/data/types"
import type {
  EmployeeInput,
  HouseInput,
  ClientInput,
  Errors,
} from "../data/types"
export interface HouseOption {
  id: string
  name: string
  address: string
  status?: string
  clientCount: number
}
export interface SaveFeedback extends Error {
  fields?: Errors
}
export interface EmployeeFormData {
  employee?: Employee
  id?: string
  houseIds: string[]
  houses: HouseOption[]
  actorRole: string
  roleOptions?: readonly string[]
  backend?: boolean
  onSave: (value: EmployeeInput, file?: File) => Promise<{ id: string }>
}
export interface HouseFormData {
  house?: House
  id?: string
  managers: string[]
  backend?: boolean
  onSave: (value: HouseInput, file?: File) => Promise<{ id: string }>
}
export interface ClientFormData {
  client?: Client
  id?: string
  houseId?: string
  houses: HouseOption[]
  backend?: boolean
  onSave: (
    value: ClientInput,
    contacts: Client["contacts"],
    file?: File,
  ) => Promise<{ id: string }>
}
