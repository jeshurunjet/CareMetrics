export interface ClockInConfirmation {
  id: string
  shiftId: string
  houseId: string | null
  clockIn: string
  measuredAt: string | null
  accuracyMetres: number | null
  policyVersion: string | null
  verification: string | null
}
export interface ClockInState {
  available: boolean
  code: string
  message: string
  testOnly: boolean
  attendance: ClockInConfirmation | null
}
