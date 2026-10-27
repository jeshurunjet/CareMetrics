import "server-only"
import { database } from "../db"
import { requireEmployee, requireCapability } from "../auth/access"
import { AccessError, entityId } from "../errors"
import { object, ManagementError } from "../admin/validation"
import { elapsedMilliseconds } from "../../modules/attendance/duration"
import { fromNZDateTimeInput } from "../../lib/time"
import { addDays, validDay } from "../../modules/staff/roster/dates"
import { clockOutAvailability } from "./out-policy"
import type { Prisma } from "../../generated/prisma/client"
import type {
  AttendanceRead,
  AttendanceHistory,
} from "../../modules/attendance/types"
const select = {
  id: true,
  organisationId: true,
  employeeId: true,
  shiftId: true,
  houseId: true,
  clockIn: true,
  clockOut: true,
  verification: true,
  house: {
    select: {
      id: true,
      name: true,
      organisation: { select: { isFictionalDemo: true } },
    },
  },
  shift: {
    select: {
      startsAt: true,
      endsAt: true,
      status: true,
      houseId: true,
      house: {
        select: {
          id: true,
          name: true,
          organisation: { select: { isFictionalDemo: true } },
        },
      },
      employee: { select: { name: true } },
    },
  },
} as const
function dto(
  row: Prisma.AttendanceRecordGetPayload<{ select: typeof select }>,
  ownerAction = true,
): AttendanceRead {
  const clockIn = row.clockIn?.toISOString() ?? null,
    clockOut = row.clockOut?.toISOString() ?? null
  return {
    id: row.id,
    verification: row.verification,
    shiftId: row.shiftId,
    employeeId: row.employeeId,
    employeeName: row.shift.employee.name,
    houseId: row.houseId ?? row.shift.houseId,
    houseName: row.house?.name ?? row.shift.house.name,
    startsAt: row.shift.startsAt.toISOString(),
    endsAt: row.shift.endsAt.toISOString(),
    shiftStatus: row.shift.status,
    clockIn,
    clockOut,
    status: clockOut ? "COMPLETED" : clockIn ? "OPEN" : "INCOMPLETE",
    elapsedMilliseconds: elapsedMilliseconds(clockIn, clockOut),
    clockOutAvailability: ownerAction
      ? clockOutAvailability(
          row.organisationId,
          row.clockIn,
          row.clockOut,
          row.verification,
          row.house?.organisation.isFictionalDemo ??
            row.shift.house.organisation.isFictionalDemo,
        )
      : {
          available: false,
          mode: "UNCONFIGURED",
          code: "READ_ONLY",
          message: "Management attendance is read-only.",
          testOnly: false,
        },
  }
}
function input(value: unknown, admin: boolean) {
  try {
    const q = object(value, [
      "page",
      "house",
      "status",
      "from",
      "to",
      "attendanceId",
      ...(admin ? ["employee"] : []),
    ])
    for (const v of Object.values(q))
      if (typeof v !== "string") throw new AccessError(400)
    const p = q as Record<string, string>
    if (p.page && (!/^[1-9]\d{0,5}$/.test(p.page) || Number(p.page) > 100000))
      throw new AccessError(400)
    if (p.status && !["open", "completed", "incomplete"].includes(p.status))
      throw new AccessError(400)
    for (const k of ["from", "to"])
      if (p[k] && !validDay(p[k])) throw new AccessError(400)
    if (p.from && p.to && p.from > p.to) throw new AccessError(400)
    for (const k of ["house", "employee", "attendanceId"])
      if (p[k]) entityId(p[k])
    return p
  } catch (error) {
    if (error instanceof ManagementError) throw new AccessError(400)
    throw error
  }
}
async function history(
  value: unknown,
  admin: boolean,
): Promise<AttendanceHistory> {
  const actor = admin
      ? await requireCapability("admin.attendanceViewing")
      : await requireEmployee(),
    q = input(value, admin),
    db = database()
  const base: Prisma.AttendanceRecordWhereInput = {
    organisationId: actor.organisationId,
    ...(!admin ? { employeeId: actor.id } : {}),
  }
  // Historical own metadata is retained even if live house/client access has been withdrawn.
  const houses = await db.house.findMany({
    where: {
      organisationId: actor.organisationId,
      ...(!admin
        ? {
            OR: [
              { assignments: { some: { employeeId: actor.id, active: true } } },
              {
                attendance: {
                  some: {
                    employeeId: actor.id,
                    organisationId: actor.organisationId,
                  },
                },
              },
              {
                shifts: {
                  some: {
                    employeeId: actor.id,
                    attendance: { is: { employeeId: actor.id, houseId: null } },
                  },
                },
              },
            ],
          }
        : {}),
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })
  const employees = admin
    ? await db.user.findMany({
        where: { organisationId: actor.organisationId },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : []
  if (q.house && !houses.some((h) => h.id === q.house))
    throw new AccessError(404)
  if (q.employee && !employees.some((e) => e.id === q.employee))
    throw new AccessError(404)
  const start = q.from ? fromNZDateTimeInput(q.from + "T00:00") : "",
    end = q.to ? fromNZDateTimeInput(addDays(q.to, 1) + "T00:00") : ""
  if ((q.from && !start) || (q.to && !end)) throw new AccessError(400)
  const where: Prisma.AttendanceRecordWhereInput = {
    ...base,
    ...(q.employee ? { employeeId: q.employee } : {}),
    ...(q.house
      ? {
          OR: [
            { houseId: q.house },
            { houseId: null, shift: { houseId: q.house } },
          ],
        }
      : {}),
    ...(q.status === "open"
      ? { clockIn: { not: null }, clockOut: null }
      : q.status === "completed"
        ? { clockOut: { not: null } }
        : q.status === "incomplete"
          ? { clockIn: null, clockOut: null }
          : {}),
    ...(start || end
      ? {
          shift: {
            startsAt: {
              ...(start ? { gte: new Date(start) } : {}),
              ...(end ? { lt: new Date(end) } : {}),
            },
          },
        }
      : {}),
  }
  const per = admin ? 20 : 6,
    total = await db.attendanceRecord.count({ where }),
    page = Math.min(Number(q.page || 1), Math.max(1, Math.ceil(total / per)))
  const rows = await db.attendanceRecord.findMany({
    where,
    select,
    orderBy: [{ clockIn: { sort: "desc", nulls: "last" } }, { id: "desc" }],
    skip: (page - 1) * per,
    take: per,
  })
  const detail = q.attendanceId
    ? await db.attendanceRecord.findFirst({
        where: { ...base, id: q.attendanceId },
        select,
      })
    : null
  if (q.attendanceId && !detail) throw new AccessError(404)
  return {
    rows: rows.map((row) => dto(row, !admin)),
    total,
    page,
    per,
    detail: detail ? dto(detail, !admin) : null,
    houses,
    employees,
    filters: q,
  }
}
export function getStaffAttendanceHistory(value: unknown = {}) {
  return history(value, false)
}
export function getAdminAttendanceHistory(value: unknown = {}) {
  return history(value, true)
}
export async function getOwnAttendanceOverview(): Promise<AttendanceRead | null> {
  const actor = await requireEmployee(),
    db = database(),
    where = {
      organisationId: actor.organisationId,
      employeeId: actor.id,
      clockIn: { not: null },
    }
  const open = await db.attendanceRecord.findFirst({
    where: { ...where, clockOut: null },
    select,
  })
  const latest =
    open ??
    (await db.attendanceRecord.findFirst({
      where,
      select,
      orderBy: [{ clockIn: "desc" }, { id: "desc" }],
    }))
  return latest ? dto(latest) : null
}
