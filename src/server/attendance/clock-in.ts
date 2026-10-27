import "server-only"
import { createHmac } from "node:crypto"
import { auth } from "../auth"
import { requireEmployee } from "../auth/access"
import { database } from "../db"
import { AccessError, entityId } from "../errors"
import { audit } from "../admin/transaction"
import { effectiveAttendancePolicy } from "./effective-policy"
import {
  isRecordingDemo,
  GPS_RECORDING_DEMO,
  LOCATION_RETENTION_MS,
} from "./demo-policy"
import { clockInInput, eligible, reject, verifyPosition } from "./validation"
import { confirmation, clockInState, houseApproved } from "./state"
export const attendanceSelect = {
  organisationId: true,
  clockOut: true,
  clockOutPolicyVersion: true,
  id: true,
  shiftId: true,
  houseId: true,
  clockIn: true,
  measuredAt: true,
  accuracyMetres: true,
  policyVersion: true,
  verification: true,
} as const
const shiftSelect = {
  id: true,
  organisationId: true,
  employeeId: true,
  houseId: true,
  startsAt: true,
  endsAt: true,
  status: true,
  house: {
    select: {
      active: true,
      latitude: true,
      longitude: true,
      organisation: { select: { isFictionalDemo: true } },
    },
  },
  attendance: {
    select: { ...attendanceSelect, requestId: true, requestDigest: true },
  },
} as const
export async function clockIn(value: unknown) {
  const receivedAt = new Date(Date.now()),
    initial = await requireEmployee(),
    session = await auth(),
    d = clockInInput(value)
  if (!session?.user) throw new AccessError(401)
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new AccessError(503)
  const digest = createHmac("sha256", secret)
    .update(
      JSON.stringify([
        d.shiftId,
        d.requestId,
        d.latitude,
        d.longitude,
        d.accuracyMetres,
        d.measuredAt,
      ]),
    )
    .digest("hex")
  try {
    return await database().$transaction(
      async (tx) => {
        // Share lock order with scheduling/house/assignment changes; then recheck identity.
        await tx.$queryRaw`SELECT id FROM "Organisation" WHERE id = ${initial.organisationId}::uuid FOR UPDATE`
        await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${initial.id}::uuid FOR UPDATE`
        const actor = await tx.user.findFirst({
          where: {
            id: initial.id,
            organisationId: initial.organisationId,
            status: "ACTIVE",
            sessionVersion: session.user.sessionVersion,
            organisation: { active: true },
          },
          select: {
            id: true,
            organisationId: true,
            employeeCode: true,
            name: true,
            role: true,
            email: true,
            status: true,
            organisation: { select: { isFictionalDemo: true } },
          },
        })
        if (!actor) throw new AccessError(401)
        const shift = await tx.shift.findFirst({
          where: {
            id: d.shiftId,
            organisationId: actor.organisationId,
            employeeId: actor.id,
          },
          select: shiftSelect,
        })
        if (!shift) throw new AccessError(404)
        const assignment = await tx.employeeHouseAssignment.findFirst({
          where: {
            organisationId: actor.organisationId,
            employeeId: actor.id,
            houseId: shift.houseId,
            active: true,
          },
          select: { houseId: true },
        })
        if (!assignment || !shift.house.active) throw new AccessError(404)
        if (shift.status !== "SCHEDULED")
          reject(
            "INELIGIBLE_SHIFT",
            "Cancelled shifts cannot be clocked in.",
            409,
          )
        // An exact retry reads a committed result; it never creates a new event or requires a new measurement.
        if (shift.attendance) {
          if (
            shift.attendance.requestId === d.requestId &&
            shift.attendance.requestDigest === digest &&
            shift.attendance.clockIn
          )
            return {
              attendance: confirmation(
                shift.attendance,
                actor.organisation.isFictionalDemo,
              ),
              replayed: true,
            }
          reject(
            "EXISTING_ATTENDANCE",
            "Attendance already exists for this shift. Refresh to view the recorded result.",
            409,
          )
        }
        const used = await tx.attendanceRecord.findFirst({
          where: {
            organisationId: actor.organisationId,
            employeeId: actor.id,
            requestId: d.requestId,
          },
          select: { id: true },
        })
        if (used)
          reject(
            "REQUEST_CONFLICT",
            "This request identifier has already been used.",
            409,
          )
        const p = effectiveAttendancePolicy(actor.organisationId)
        if (!p)
          reject(
            "POLICY_UNAVAILABLE",
            "Attendance configuration requires management attention.",
            503,
          )
        if (!houseApproved(p, shift))
          reject(
            "HOUSE_UNCONFIGURED",
            "House location configuration requires management attention.",
            503,
          )
        if (!eligible(p, shift.startsAt, shift.endsAt, receivedAt.getTime()))
          reject(
            "INELIGIBLE_SHIFT",
            "This shift is outside the configured clock-in window.",
            409,
          )
        verifyPosition(
          p,
          d,
          Number(shift.house.latitude),
          Number(shift.house.longitude),
          receivedAt.getTime(),
        )
        const open = await tx.attendanceRecord.findFirst({
          where: {
            organisationId: actor.organisationId,
            employeeId: actor.id,
            clockIn: { not: null },
            clockOut: null,
          },
          select: { id: true },
        })
        if (open)
          reject(
            "ACTIVE_ATTENDANCE",
            "Another attendance record remains open. Clock-out is not available yet.",
            409,
          )
        const demo = isRecordingDemo(p)
        const verification = demo
          ? GPS_RECORDING_DEMO
          : "SERVER_VALIDATED_LOCATION_TEST"
        const row = await tx.attendanceRecord.create({
          data: {
            organisationId: actor.organisationId,
            employeeId: actor.id,
            shiftId: shift.id,
            houseId: shift.houseId,
            clockIn: receivedAt,
            measuredAt: new Date(d.measuredAt),
            accuracyMetres: d.accuracyMetres,
            verification,
            policyVersion: p.version,
            policySnapshot: isRecordingDemo(p)
              ? {
                  approval: p.approval,
                  mode: p.mode,
                  retentionDays: p.retentionDays,
                  maxAccuracyMetres: p.maxAccuracyMetres,
                  maxAgeMs: p.maxAgeMs,
                  maxFutureSkewMs: p.maxFutureSkewMs,
                  earlyWindowMs: p.earlyWindowMs,
                  lateWindowMs: p.lateWindowMs,
                }
              : {
                  approval: p.approval,
                  maxDistanceMetres: p.maxDistanceMetres,
                  maxAccuracyMetres: p.maxAccuracyMetres,
                  maxAgeMs: p.maxAgeMs,
                  maxFutureSkewMs: p.maxFutureSkewMs,
                  earlyWindowMs: p.earlyWindowMs,
                  lateWindowMs: p.lateWindowMs,
                  boundaryRule: p.boundaryRule,
                },
            requestId: d.requestId,
            requestDigest: digest,
          },
          select: attendanceSelect,
        })
        if (demo)
          await tx.attendanceLocationEvidence.create({
            data: {
              attendanceId: row.id,
              organisationId: actor.organisationId,
              latitude: d.latitude,
              longitude: d.longitude,
              expiresAt: new Date(
                new Date(d.measuredAt).getTime() + LOCATION_RETENTION_MS,
              ),
            },
          })
        await audit(
          { tx, actor },
          "attendance.clocked_in",
          "attendance",
          row.id,
          {
            shiftId: shift.id,
            houseId: shift.houseId,
            policyVersion: p.version,
            verification,
          },
        )
        return {
          attendance: confirmation(row, actor.organisation.isFictionalDemo),
          replayed: false,
        }
      },
      { maxWait: 10000, timeout: 15000 },
    )
  } catch (error) {
    if ((error as { code?: string })?.code === "P2002")
      reject(
        "ATTENDANCE_CONFLICT",
        "Attendance changed concurrently. Refresh before retrying.",
        409,
      )
    throw error
  }
}
export async function getClockInState(shiftId: string) {
  const actor = await requireEmployee()
  const row = await database().shift.findFirst({
    where: {
      id: entityId(shiftId),
      organisationId: actor.organisationId,
      employeeId: actor.id,
      house: {
        active: true,
        assignments: { some: { employeeId: actor.id, active: true } },
      },
    },
    select: shiftSelect,
  })
  if (!row) throw new AccessError(404)
  const open = await database().attendanceRecord.findFirst({
    where: {
      organisationId: actor.organisationId,
      employeeId: actor.id,
      clockIn: { not: null },
      clockOut: null,
    },
    select: { shiftId: true },
  })
  return clockInState(row, new Date(), !!open && open.shiftId !== row.id)
}
