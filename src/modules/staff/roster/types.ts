export interface AttendanceRecord {
  id: string
  shiftId: string
  employeeId: string
  clockIn?: string
  clockOut?: string
  location?: "fictional-verified" | "fictional-unverified"
  notes?: string
}
export interface AttendanceCorrectionRequest {
  id: string
  attendanceId: string
  shiftId: string
  requestingEmployeeId: string
  proposedClockIn?: string
  proposedClockOut?: string
  reason: string
  requestedAt: string
  status: "pending" | "approved" | "rejected"
}
export interface AttendanceProposal {
  clockIn: string
  clockOut: string
  reason: string
}
