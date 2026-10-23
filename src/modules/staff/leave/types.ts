export type LeaveStatus = "pending" | "approved" | "rejected"
export interface LeaveType {
  id: string
  name: string
  active: boolean
}
export interface LeaveDecision {
  reviewerId?: string
  reviewerName?: string
  decidedAt: string
  notes?: string
}
export interface LeaveRequest {
  id: string
  employeeId: string
  typeId: string
  start: string
  end: string
  notes: string
  submittedAt: string
  status: LeaveStatus
  decision?: LeaveDecision
}
export interface LeaveBalance {
  employeeId: string
  typeId: string
  value: number
  unit: "days"
  asOf: string
}
export interface LeaveInput {
  typeId: string
  start: string
  end: string
  notes: string
}
