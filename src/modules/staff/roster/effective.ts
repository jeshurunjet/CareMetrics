import type { StaffSnapshot } from "../data/types"
import type { AttendanceRecord } from "./types"
/** Event rows remain immutable. Only reviewed versions change operational display. */
export const latestAttendanceDecision = (s: StaffSnapshot, id: string) =>
  s.attendanceCorrections
    .filter(
      (c) => c.attendanceId === id && c.status === "approved" && c.decision,
    )
    .sort((a, b) =>
      b.decision!.decidedAt.localeCompare(a.decision!.decidedAt),
    )[0]
export function effectiveAttendance(
  s: StaffSnapshot,
  a: AttendanceRecord,
): AttendanceRecord {
  const decision = latestAttendanceDecision(s, a.id)?.decision
  return decision
    ? {
        ...a,
        clockIn: decision.effectiveClockIn,
        clockOut: decision.effectiveClockOut,
        location: "fictional-unverified",
      }
    : a
}
