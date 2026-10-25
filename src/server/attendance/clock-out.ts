import "server-only"
import { createHmac } from "node:crypto"
import { auth } from "../auth"
import { database } from "../db"
import { requireEmployee } from "../auth/access"
import { AccessError, entityId } from "../errors"
import { audit } from "../admin/transaction"
import { attendanceSelect } from "./clock-in"
import { confirmation } from "./state"
import { clockOutPolicy } from "./out-policy"
import { reject } from "./validation"
export function clockOutInput(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new AccessError(400)
  const p = value as Record<string, unknown>
  if (Object.keys(p).sort().join(",") !== "attendanceId,requestId")
    throw new AccessError(400)
  return {
    attendanceId: entityId(p.attendanceId),
    requestId: entityId(p.requestId),
  }
}
export async function clockOut(value: unknown) {
  const receivedAt = new Date(Date.now()),
    initial = await requireEmployee(),
    session = await auth(),
    input = clockOutInput(value)
  if (!session?.user) throw new AccessError(401)
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new AccessError(503)
  const digest = createHmac("sha256", secret)
    .update(JSON.stringify(["clock-out", input.attendanceId, input.requestId]))
    .digest("hex")
  try {
    return await database().$transaction(
      async (tx) => {
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
          },
        })
        if (!actor) throw new AccessError(401)
        const row = await tx.attendanceRecord.findFirst({
          where: {
            id: input.attendanceId,
            organisationId: actor.organisationId,
            employeeId: actor.id,
          },
          select: {
            ...attendanceSelect,
            clockOutRequestId: true,
            clockOutRequestDigest: true,
          },
        })
        if (!row) throw new AccessError(404)
        if (!row.clockIn)
          reject(
            "NO_OPEN_ATTENDANCE",
            "There is no recorded clock-in to complete.",
            409,
          )
        if (row.clockOut) {
          if (
            row.clockOutRequestId === input.requestId &&
            row.clockOutRequestDigest === digest
          )
            return { attendance: confirmation(row), replayed: true }
          reject(
            "ATTENDANCE_COMPLETED",
            "Attendance is already completed. Refresh to view the original result.",
            409,
          )
        }
        const p = clockOutPolicy(actor.organisationId)
        if (!p || p.mode === "UNCONFIGURED")
          reject(
            "CLOCK_OUT_POLICY_UNAVAILABLE",
            "Clock-out policy requires management attention.",
            503,
          )
        if (p.mode === "LOCATION_REQUIRED")
          reject(
            "CLOCK_OUT_LOCATION_REQUIRED",
            "GPS-required clock-out verification is not approved or implemented.",
            503,
          )
        if (receivedAt.getTime() <= row.clockIn.getTime())
          reject(
            "CLOCK_OUT_TIME_CONFLICT",
            "Server time must be after the recorded clock-in. Retry or contact management.",
            409,
          )
        // Own-record closure deliberately does not restore withdrawn house/client access.
        const saved = await tx.attendanceRecord.update({
          where: { id: row.id },
          data: {
            clockOut: receivedAt,
            clockOutRequestId: input.requestId,
            clockOutRequestDigest: digest,
            clockOutPolicyVersion: p.version,
            clockOutPolicySnapshot: { approval: p.approval, mode: p.mode },
            clockOutVerification: "NO_LOCATION_REQUIRED_TEST",
          },
          select: attendanceSelect,
        })
        await audit(
          { tx, actor },
          "attendance.clocked_out",
          "attendance",
          row.id,
          {
            shiftId: row.shiftId,
            policyVersion: p.version,
            verification: "NO_LOCATION_REQUIRED_TEST",
          },
        )
        return { attendance: confirmation(saved), replayed: false }
      },
      { maxWait: 10000, timeout: 15000 },
    )
  } catch (error) {
    if ((error as { code?: string })?.code === "P2002")
      reject(
        "CLOCK_OUT_CONFLICT",
        "Attendance changed concurrently. Refresh before retrying.",
        409,
      )
    throw error
  }
}
