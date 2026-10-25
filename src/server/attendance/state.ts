import { elapsedMilliseconds } from "../../modules/attendance/duration"
import { clockOutAvailability } from "./out-policy"
import "server-only"
import type {
  ClockInConfirmation,
  ClockInState,
} from "../../modules/attendance/types"
import { validCoordinates } from "../../modules/attendance/geo"
import { attendancePolicy, type AttendancePolicy } from "./policy"
import { eligible } from "./validation"
export interface AttendanceEvidence {
  organisationId: string
  clockOut: Date | null
  clockOutPolicyVersion: string | null
  id: string
  shiftId: string
  houseId: string | null
  clockIn: Date | null
  measuredAt: Date | null
  accuracyMetres: number | null
  policyVersion: string | null
  verification: string | null
}
interface DecimalCoordinate {
  toNumber: () => number
}
interface HouseCoordinates {
  latitude: number | DecimalCoordinate | null
  longitude: number | DecimalCoordinate | null
  active: boolean
}
export interface ClockInShift {
  id: string
  organisationId: string
  houseId: string
  status: string
  startsAt: Date
  endsAt: Date
  house: HouseCoordinates
  attendance: AttendanceEvidence | null
}
export function confirmation(
  row: AttendanceEvidence,
): ClockInConfirmation | null {
  if (!row.clockIn) return null
  return {
    id: row.id,
    shiftId: row.shiftId,
    houseId: row.houseId,
    clockIn: row.clockIn.toISOString(),
    clockOut: row.clockOut?.toISOString() ?? null,
    elapsedMilliseconds: elapsedMilliseconds(
      row.clockIn.toISOString(),
      row.clockOut?.toISOString() ?? null,
    ),
    clockOutPolicyVersion: row.clockOutPolicyVersion,
    clockOutAvailability: clockOutAvailability(
      row.organisationId,
      row.clockIn,
      row.clockOut,
    ),
    measuredAt: row.measuredAt?.toISOString() ?? null,
    accuracyMetres: row.accuracyMetres,
    policyVersion: row.policyVersion,
    verification: row.verification,
  }
}
export function houseApproved(p: AttendancePolicy, shift: ClockInShift) {
  const h = shift.house
  return (
    h.active &&
    h.latitude !== null &&
    h.longitude !== null &&
    validCoordinates(Number(h.latitude), Number(h.longitude)) &&
    p.houses.some(
      (approved) =>
        approved.id === shift.houseId &&
        approved.latitude === Number(h.latitude) &&
        approved.longitude === Number(h.longitude),
    )
  )
}
export function clockInState(
  shift: ClockInShift,
  now: Date,
  otherOpen = false,
): ClockInState {
  const recorded = shift.attendance ? confirmation(shift.attendance) : null
  const base = { available: false, testOnly: false, attendance: recorded }
  if (recorded)
    return {
      ...base,
      code: recorded.clockOut ? "CLOCKED_OUT" : "CLOCKED_IN",
      message: recorded.clockOut ? "Clocked Out" : "Clocked In",
      testOnly: recorded.verification === "SERVER_VALIDATED_LOCATION_TEST",
    }
  if (shift.attendance)
    return {
      ...base,
      code: "EXISTING_ATTENDANCE",
      message: "Attendance history already exists. Contact Management.",
    }
  const p = attendancePolicy(shift.organisationId)
  if (!p)
    return {
      ...base,
      code: "POLICY_UNAVAILABLE",
      message:
        "Attendance configuration requires management attention. Contact Management.",
    }
  if (!houseApproved(p, shift))
    return {
      ...base,
      code: "HOUSE_UNCONFIGURED",
      message:
        "House location configuration requires management attention. Contact Management.",
    }
  if (
    shift.status !== "SCHEDULED" ||
    !eligible(p, shift.startsAt, shift.endsAt, now.getTime())
  )
    return {
      ...base,
      testOnly: true,
      code: "INELIGIBLE_SHIFT",
      message:
        "This shift is outside the configured clock-in window. Contact Management.",
    }
  if (otherOpen)
    return {
      ...base,
      testOnly: true,
      code: "ACTIVE_ATTENDANCE",
      message:
        "An open attendance record already exists. Complete that attendance under the configured policy or Contact Management.",
    }
  return {
    ...base,
    testOnly: true,
    code: "AVAILABLE",
    available: true,
    message:
      "Development test policy only. Location is checked once when you request clock-in.",
  }
}
