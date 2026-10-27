export interface ClockOutAvailability {
  demoRecording?: boolean
  available: boolean
  mode: "UNCONFIGURED" | "NO_LOCATION_REQUIRED" | "LOCATION_REQUIRED"
  code: string
  message: string
  testOnly: boolean
}
export interface ClockInConfirmation {
  id: string
  shiftId: string
  houseId: string | null
  clockIn: string
  clockOut: string | null
  elapsedMilliseconds: number | null
  clockOutPolicyVersion: string | null
  clockOutAvailability: ClockOutAvailability
  measuredAt: string | null
  accuracyMetres: number | null
  policyVersion: string | null
  verification: string | null
}
export interface ClockInState {
  positionPolicy?: import("./foreground-location").PositionPolicy
  mode?: "GPS_LOCATION_RECORDED_DEMO"
  available: boolean
  code: string
  message: string
  testOnly: boolean
  attendance: ClockInConfirmation | null
}

export interface AttendanceRead {
  verification?: string | null
  id: string
  shiftId: string
  employeeId: string
  employeeName: string
  houseId: string
  houseName: string
  startsAt: string
  endsAt: string
  shiftStatus: string
  clockIn: string | null
  clockOut: string | null
  status: "OPEN" | "COMPLETED" | "INCOMPLETE"
  elapsedMilliseconds: number | null
  clockOutAvailability: ClockOutAvailability
}
export interface AttendanceOption {
  id: string
  name: string
}
export interface AttendanceHistory {
  rows: AttendanceRead[]
  total: number
  page: number
  per: number
  detail: AttendanceRead | null
  houses: AttendanceOption[]
  employees: AttendanceOption[]
  filters: Record<string, string>
}
