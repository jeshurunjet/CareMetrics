import type { Shift } from "../data/types"
import type { AttendanceRecord, AttendanceCorrectionRequest } from "./types"
import { fromNZDateTimeInput, toNZDateTimeInput } from "../../../lib/time"
import { addDays, nzDay } from "./dates"
/** Extends the existing sh1–sh4/co1–co2 fixtures; never replaces their IDs or times. */
export function seedScheduleHistory(now: string) {
  const day = nzDay(now),
    at = (days: number, time: string) =>
      fromNZDateTimeInput(`${addDays(day, days)}T${time}`)
  const overnightEndOffset = toNZDateTimeInput(now).slice(11) < "06:05" ? -1 : 0
  const shifts: Shift[] = Array.from({ length: 8 }, (_, i) => ({
    id: `history-${i + 1}`,
    staffId: "s1",
    houseId: i % 2 ? "h2" : "h1",
    start: at(-i - 2, "07:00"),
    end: at(-i - 2, "15:00"),
    assignedBy: "Mere Walker (demo)",
    notes: "Fictional roster assignment for UI review.",
  }))
  shifts.push(
    {
      id: "overnight",
      staffId: "s1",
      houseId: "h2",
      start: at(overnightEndOffset - 1, "22:00"),
      end: at(overnightEndOffset, "06:00"),
      assignedBy: "Example Administrator",
      notes:
        "Fictional overnight shift; clock-out is on the following calendar date.",
    },
    {
      id: "future-overnight",
      staffId: "s1",
      houseId: "h1",
      start: at(4, "22:00"),
      end: at(5, "06:00"),
      assignedBy: "Mere Walker (demo)",
    },
    {
      id: "cancelled",
      staffId: "s1",
      houseId: "h2",
      start: at(3, "18:00"),
      end: at(3, "22:00"),
      assignedBy: "Mere Walker (demo)",
      status: "cancelled",
      notes:
        "Cancelled fictional assignment. Not eligible for ordinary clock-in.",
    },
    {
      id: "restricted-shift",
      staffId: "s4",
      houseId: "h3",
      start: at(0, "07:00"),
      end: at(0, "15:00"),
      assignedBy: "Example Manager",
    },
  )
  const attendance: AttendanceRecord[] = shifts
    .filter((sh) => sh.id.startsWith("history-") && sh.id !== "history-8")
    .map((sh, i) => ({
      id: `at-${sh.id}`,
      employeeId: sh.staffId,
      shiftId: sh.id,
      clockIn: sh.start,
      clockOut:
        i === 0
          ? undefined
          : new Date(Date.parse(sh.end) + 5 * 60000).toISOString(),
      location: i % 2 ? "fictional-unverified" : "fictional-verified",
      notes: "Fictional recorded attendance, not a real attendance event.",
    }))
  attendance.push(
    {
      id: "at-overnight",
      employeeId: "s1",
      shiftId: "overnight",
      clockIn: at(overnightEndOffset - 1, "21:55"),
      clockOut: at(overnightEndOffset, "06:05"),
      location: "fictional-verified",
    },
    {
      id: "restricted-attendance",
      employeeId: "s4",
      shiftId: "restricted-shift",
      clockIn: at(0, "07:00"),
      clockOut: at(0, "15:00"),
    },
    {
      id: "coworker-attendance",
      employeeId: "s2",
      shiftId: "co1",
      clockIn: new Date(Date.parse(now) - 3600000).toISOString(),
      notes: "Private coworker attendance example",
    },
  )
  const corrections: AttendanceCorrectionRequest[] = [
    "pending",
    "approved",
    "rejected",
  ].map((status, i) => ({
    id: `attendance-correction-${i + 1}`,
    attendanceId: `at-history-${i + 2}`,
    shiftId: `history-${i + 2}`,
    requestingEmployeeId: "s1",
    proposedClockOut: at(-i - 3, "15:10"),
    reason: "Fictional historical correction request for management review.",
    requestedAt: new Date(Date.parse(now) - 3600000).toISOString(),
    status: status as AttendanceCorrectionRequest["status"],
  }))
  return { shifts, attendance, corrections }
}
