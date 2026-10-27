import { distanceMetres, validCoordinates } from "../../modules/attendance/geo"
import type { ClockInPolicy } from "./effective-policy"
import { isRecordingDemo } from "./demo-policy"
export class ClockInError extends Error {
  constructor(
    public status: 400 | 409 | 503,
    public code: string,
    message: string,
  ) {
    super(message)
  }
}
export function reject(
  code: string,
  message: string,
  status: 400 | 409 | 503 = 400,
): never {
  throw new ClockInError(
    status,
    code,
    message + " Contact Management if you cannot complete verification.",
  )
}
export interface ClockInInput {
  shiftId: string
  requestId: string
  latitude: number
  longitude: number
  accuracyMetres: number
  measuredAt: number
}
export function clockInInput(value: unknown): ClockInInput {
  const keys = [
    "shiftId",
    "requestId",
    "latitude",
    "longitude",
    "accuracyMetres",
    "measuredAt",
  ]
  if (!value || typeof value !== "object" || Array.isArray(value))
    reject("INVALID_INPUT", "Provide a measured location.")
  const d = value as Record<string, unknown>,
    uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
  if (
    Object.keys(d).length !== keys.length ||
    Object.keys(d).some((k) => !keys.includes(k)) ||
    typeof d.shiftId !== "string" ||
    !uuid.test(d.shiftId) ||
    typeof d.requestId !== "string" ||
    !uuid.test(d.requestId)
  )
    reject("INVALID_INPUT", "Invalid clock-in request.")
  if (
    !validCoordinates(d.latitude, d.longitude) ||
    typeof d.accuracyMetres !== "number" ||
    !Number.isFinite(d.accuracyMetres) ||
    d.accuracyMetres < 0 ||
    typeof d.measuredAt !== "number" ||
    !Number.isFinite(d.measuredAt) ||
    d.measuredAt <= 0 ||
    d.measuredAt > 8640000000000000
  )
    reject(
      "INVALID_LOCATION",
      "A valid measured position, accuracy and timestamp are required.",
    )
  return d as unknown as ClockInInput
}
export function eligible(
  p: ClockInPolicy,
  startsAt: Date,
  endsAt: Date,
  receipt: number,
): boolean {
  return (
    receipt >= startsAt.getTime() - p.earlyWindowMs &&
    receipt <= startsAt.getTime() + p.lateWindowMs &&
    receipt < endsAt.getTime()
  )
}
export function verifyPosition(
  p: ClockInPolicy,
  d: ClockInInput,
  houseLatitude: number,
  houseLongitude: number,
  receipt: number,
) {
  if (d.accuracyMetres > p.maxAccuracyMetres)
    reject(
      "POOR_ACCURACY",
      "Location accuracy is insufficient. Retry in a clearer location.",
    )
  if (d.measuredAt > receipt + p.maxFutureSkewMs)
    reject(
      "FUTURE_MEASUREMENT",
      "The location timestamp is ahead of server time. Check your device clock.",
    )
  if (receipt - d.measuredAt > p.maxAgeMs)
    reject(
      "STALE_MEASUREMENT",
      "The location measurement is too old. Request a new position.",
    )
  if (isRecordingDemo(p)) return
  const distance = distanceMetres(
    d.latitude,
    d.longitude,
    houseLatitude,
    houseLongitude,
  )
  if (distance === null) reject("INVALID_LOCATION", "Invalid position.")
  if (distance + d.accuracyMetres > p.maxDistanceMetres)
    reject(
      "OUTSIDE_BOUNDARY",
      "Your reported location or its accuracy area is outside the permitted house boundary.",
    )
}
