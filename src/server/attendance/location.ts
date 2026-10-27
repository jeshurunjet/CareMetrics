import "server-only"
import { limitLocationReads } from "./location-throttle"
import { requireEmployee, requireCapability } from "../auth/access"
import { database } from "../db"
import { AccessError, entityId } from "../errors"
import { GPS_RECORDING_DEMO, LOCATION_RETENTION_MS } from "./demo-policy"
import type { AttendanceLocationRead } from "../../modules/attendance/location-types"
export async function getAttendanceLocation(
  id: string,
  admin = false,
): Promise<AttendanceLocationRead> {
  const actor = admin
    ? await requireCapability("admin.attendanceViewing")
    : await requireEmployee()
  const attendanceId = entityId(id)
  await limitLocationReads(actor.id)
  const db = database(),
    now = new Date()
  const row = await db.attendanceRecord.findFirst({
    where: {
      id: attendanceId,
      organisationId: actor.organisationId,
      ...(!admin ? { employeeId: actor.id } : {}),
    },
    select: {
      id: true,
      verification: true,
      clockIn: true,
      measuredAt: true,
      accuracyMetres: true,
      shift: {
        select: {
          employee: { select: { name: true } },
          house: { select: { name: true } },
        },
      },
      house: { select: { name: true } },
      locationEvidence: { select: { expiresAt: true, purgedAt: true } },
    },
  })
  if (!row) throw new AccessError(404)
  const meta = row.locationEvidence
  const result: AttendanceLocationRead = {
    attendanceId: row.id,
    status: "not-recorded",
    verification: row.verification,
    employeeName: row.shift.employee.name,
    houseName: row.house?.name ?? row.shift.house.name,
    clockIn: row.clockIn?.toISOString() ?? null,
    measuredAt: row.measuredAt?.toISOString() ?? null,
    accuracyMetres: row.accuracyMetres,
    expiresAt: meta?.expiresAt.toISOString() ?? null,
    remainingMs: 0,
    coordinates: null,
  }
  if (row.verification !== GPS_RECORDING_DEMO || !meta) return result
  result.status = "expired"
  if (meta.purgedAt || meta.expiresAt <= now) return result
  // Expired coordinates are not even selected into an application DTO.
  const precise = await db.attendanceLocationEvidence.findFirst({
    where: {
      attendanceId: row.id,
      organisationId: actor.organisationId,
      purgedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { latitude: true, longitude: true },
  })
  const remaining = meta.expiresAt.getTime() - Date.now()
  if (
    !precise ||
    precise.latitude === null ||
    precise.longitude === null ||
    remaining <= 0
  )
    return result
  return {
    ...result,
    status: "retained",
    remainingMs: Math.min(remaining, LOCATION_RETENTION_MS),
    coordinates: { latitude: precise.latitude, longitude: precise.longitude },
  }
}
