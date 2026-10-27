export const LOCATION_EXPIRED_MESSAGE =
  "Detailed GPS location is no longer available because the retention period has expired."
export interface AttendanceLocationRead {
  attendanceId: string
  status: "retained" | "expired" | "not-recorded"
  verification: string | null
  employeeName: string
  houseName: string
  clockIn: string | null
  measuredAt: string | null
  accuracyMetres: number | null
  expiresAt: string | null
  remainingMs: number
  coordinates: {
    latitude: number
    longitude: number
  } | null
}
