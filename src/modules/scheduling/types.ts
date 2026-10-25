import type { AttendanceRead } from "../attendance/types"
import type { ClockInState } from "../attendance/types"
export interface ShiftRead {
  id: string
  employeeId: string
  employeeName: string
  houseId: string
  houseName: string
  address: string
  startsAt: string
  endsAt: string
  status: "SCHEDULED" | "CANCELLED"
  assignedBy: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  hasAttendance: boolean
  clockInAvailable: boolean
  clockIn?: ClockInState
}
export interface ShiftCommand {
  employeeId: string
  houseId: string
  startsLocal: string
  endsLocal: string
  status: "SCHEDULED"
  notes?: string
  expectedUpdatedAt?: string
}
export interface ScheduleHouse {
  id: string
  name: string
  address: string
  active: boolean
}
export interface ScheduleEmployee {
  id: string
  name: string
  role: string
  active: boolean
  houseIds: string[]
}
export interface StaffSchedule {
  now: string
  day: string
  month: string
  employeeName: string
  shifts: ShiftRead[]
  upcoming: ShiftRead[]
  activeAttendanceShift: ShiftRead | null
  ownAttendanceSummary: AttendanceRead | null
  detail: ShiftRead | null
  houses: ScheduleHouse[]
}
export interface AdminSchedule {
  now: string
  day: string
  month: string
  shifts: ShiftRead[]
  detail: ShiftRead | null
  employees: ScheduleEmployee[]
  houses: ScheduleHouse[]
}
