import "server-only"
import { database } from "../db"
import { requireEmployee, requireCapability } from "../auth/access"
import { AccessError, entityId } from "../errors"
import {
  managementWrite,
  audit,
  changedFields,
  stamp,
} from "../admin/transaction"
import {
  object,
  text,
  expected,
  invalid,
  ManagementError,
} from "../admin/validation"
import { fromNZDateTimeInput } from "@/lib/time"
import {
  addDays,
  monthDays,
  nzDay,
  validDay,
} from "@/modules/staff/roster/dates"
import type { Prisma } from "@/generated/prisma/client"
import type {
  ShiftRead,
  StaffSchedule,
  AdminSchedule,
} from "@/modules/scheduling/types"
const select = {
  id: true,
  employeeId: true,
  houseId: true,
  startsAt: true,
  endsAt: true,
  status: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  employee: { select: { name: true } },
  house: { select: { name: true, address: true } },
  assignedBy: { select: { name: true } },
  attendance: { select: { id: true } },
} as const
function dto(
  row: Prisma.ShiftGetPayload<{ select: typeof select }>,
): ShiftRead {
  return {
    id: row.id,
    employeeId: row.employeeId,
    employeeName: row.employee.name,
    houseId: row.houseId,
    houseName: row.house.name,
    address: row.house.address,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    status: row.status,
    assignedBy: row.assignedBy?.name ?? null,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    hasAttendance: !!row.attendance,
    clockInAvailable: false,
  }
}
function input(value: unknown) {
  const d = object(value, [
    "employeeId",
    "houseId",
    "startsLocal",
    "endsLocal",
    "status",
    "notes",
    "expectedUpdatedAt",
  ])
  if (d.status !== "SCHEDULED")
    invalid(
      "status",
      "Use Scheduled; cancellation requires a separate confirmed operation.",
    )
  const start = fromNZDateTimeInput(text(d, "startsLocal", 16, true)),
    end = fromNZDateTimeInput(text(d, "endsLocal", 16, true))
  if (!start)
    invalid(
      "start",
      "Choose an unambiguous valid Pacific/Auckland start time; DST gaps and repeated times are not accepted.",
    )
  if (!end)
    invalid(
      "end",
      "Choose an unambiguous valid Pacific/Auckland end time; DST gaps and repeated times are not accepted.",
    )
  if (Date.parse(end) <= Date.parse(start))
    invalid("end", "The scheduled end must be after the start.")
  return {
    data: {
      employeeId: entityId(d.employeeId),
      houseId: entityId(d.houseId),
      startsAt: new Date(start),
      endsAt: new Date(end),
      status: "SCHEDULED" as const,
      notes: d.notes === undefined ? null : text(d, "notes", 4000) || null,
    },
    version: d.expectedUpdatedAt,
  }
}
export async function saveShift(
  value: unknown,
  id?: string,
): Promise<ShiftRead> {
  return managementWrite("admin.shiftManagement", async (ctx) => {
    const f = input(value)
    const previous = id
      ? await ctx.tx.shift.findFirst({
          where: { id: entityId(id), organisationId: ctx.actor.organisationId },
          select: { ...select, assignedById: true },
        })
      : null
    if (id && !previous) throw new AccessError(404)
    if (previous) {
      expected(f.version, previous.updatedAt)
      if (previous.attendance)
        throw new ManagementError(
          409,
          "Recorded attendance exists. Schedule changes cannot rewrite recorded history.",
        )
      if (previous.status === "CANCELLED")
        throw new ManagementError(
          409,
          "Cancelled shifts are retained and cannot be edited or reactivated.",
        )
    }
    const [employee, house, assignment] = await Promise.all([
      ctx.tx.user.findFirst({
        where: {
          id: f.data.employeeId,
          organisationId: ctx.actor.organisationId,
          status: "ACTIVE",
        },
        select: { id: true },
      }),
      ctx.tx.house.findFirst({
        where: {
          id: f.data.houseId,
          organisationId: ctx.actor.organisationId,
          active: true,
        },
        select: { id: true },
      }),
      ctx.tx.employeeHouseAssignment.findFirst({
        where: {
          organisationId: ctx.actor.organisationId,
          employeeId: f.data.employeeId,
          houseId: f.data.houseId,
          active: true,
        },
        select: { houseId: true },
      }),
    ])
    if (!employee || !house)
      invalid(
        "record",
        "Choose an active employee and house in your organisation.",
      )
    if (!assignment)
      invalid(
        "house",
        "This employee needs an active assignment to the selected house.",
      )
    const overlap = await ctx.tx.shift.findFirst({
      where: {
        organisationId: ctx.actor.organisationId,
        employeeId: f.data.employeeId,
        status: "SCHEDULED",
        startsAt: { lt: f.data.endsAt },
        endsAt: { gt: f.data.startsAt },
        ...(id ? { id: { not: id } } : {}),
      },
      select: { id: true },
    })
    if (overlap)
      throw new ManagementError(
        409,
        "This employee already has an overlapping active shift. Review the roster before saving.",
      )
    const row = previous
      ? await ctx.tx.shift.update({
          where: { id: previous.id },
          data: { ...f.data, ...stamp(previous) },
          select,
        })
      : await ctx.tx.shift.create({
          data: {
            ...f.data,
            organisationId: ctx.actor.organisationId,
            assignedById: ctx.actor.id,
          },
          select,
        })
    await audit(
      ctx,
      previous ? "shift.updated" : "shift.created",
      "shift",
      row.id,
      {
        fields: previous
          ? changedFields(previous, f.data)
          : Object.keys(f.data),
      },
    )
    return dto(row)
  })
}
export async function cancelShift(
  id: string,
  value: unknown,
): Promise<ShiftRead> {
  return managementWrite("admin.shiftManagement", async (ctx) => {
    const d = object(value, ["confirmed", "expectedUpdatedAt"])
    const row = await ctx.tx.shift.findFirst({
      where: { id: entityId(id), organisationId: ctx.actor.organisationId },
      select,
    })
    if (!row) throw new AccessError(404)
    expected(d.expectedUpdatedAt, row.updatedAt)
    if (d.confirmed !== true)
      invalid("confirmed", "Review and confirm cancellation.")
    if (row.attendance)
      throw new ManagementError(
        409,
        "Recorded attendance exists. Cancellation cannot rewrite recorded history.",
      )
    if (row.status === "CANCELLED")
      throw new ManagementError(409, "This shift is already Cancelled.")
    const updated = await ctx.tx.shift.update({
      where: { id: row.id },
      data: { status: "CANCELLED", ...stamp(row) },
      select,
    })
    await audit(ctx, "shift.cancelled", "shift", row.id, {
      fromStatus: row.status,
      toStatus: "CANCELLED",
    })
    return dto(updated)
  })
}
function parseWindowInput(value: unknown, now: Date) {
  const d = object(value, ["day", "month", "house", "employee", "shiftId"])
  for (const key of Object.keys(d))
    if (typeof d[key] !== "string") invalid(key, "Choose a valid filter.")
  const day = d.day as string | undefined || nzDay(now.toISOString()),
    month = d.month as string | undefined || day.slice(0, 7)
  if (!validDay(day) || !validDay(month + "-01"))
    invalid("date", "Choose a valid date/month.")
  const days = monthDays(month),
    start = fromNZDateTimeInput(days[0] + "T00:00"),
    end = fromNZDateTimeInput(addDays(days.at(-1)!, 1) + "T00:00")
  if (!start || !end) invalid("date", "Date range unavailable.")
  return {
    day,
    month,
    range: { startsAt: { lt: new Date(end) }, endsAt: { gt: new Date(start) } },
    house: d.house ? entityId(d.house) : undefined,
    employee: d.employee ? entityId(d.employee) : undefined,
    shiftId: d.shiftId ? entityId(d.shiftId) : undefined,
  }
}
function windowInput(value: unknown, now: Date) {
  try {
    return parseWindowInput(value, now)
  } catch (error) {
    if (error instanceof ManagementError) throw new AccessError(400)
    throw error
  }
}
export async function getStaffSchedule(
  value: unknown = {},
): Promise<StaffSchedule> {
  const employee = await requireEmployee(),
    now = new Date(),
    q = windowInput(value, now)
  if (q.employee) throw new AccessError(400)
  const houses = await database().house.findMany({
    where: {
      organisationId: employee.organisationId,
      active: true,
      assignments: { some: { employeeId: employee.id, active: true } },
    },
    select: { id: true, name: true, address: true, active: true },
    orderBy: { name: "asc" },
  })
  if (q.house && !houses.some((h) => h.id === q.house))
    throw new AccessError(404)
  const scope = {
    organisationId: employee.organisationId,
    employeeId: employee.id,
    houseId: { in: houses.map((h) => h.id) },
    house: {
      active: true,
      assignments: { some: { employeeId: employee.id, active: true } },
    },
  }
  const [shifts, upcoming, detail] = await Promise.all([
    database().shift.findMany({
      where: { ...scope, ...q.range, ...(q.house ? { houseId: q.house } : {}) },
      select,
      orderBy: [{ startsAt: "asc" }, { id: "asc" }],
    }),
    database().shift.findMany({
      where: { ...scope, status: "SCHEDULED", endsAt: { gt: now } },
      select,
      orderBy: [{ startsAt: "asc" }, { id: "asc" }],
      take: 3,
    }),
    q.shiftId
      ? database().shift.findFirst({
          where: { ...scope, id: q.shiftId },
          select,
        })
      : null,
  ])
  if (q.shiftId && !detail) throw new AccessError(404)
  return {
    now: now.toISOString(),
    day: q.day,
    month: q.month,
    employeeName: employee.name,
    shifts: shifts.map(dto),
    upcoming: upcoming.map(dto),
    detail: detail ? dto(detail) : null,
    houses,
  }
}
export async function getAdminSchedule(
  value: unknown = {},
): Promise<AdminSchedule> {
  const actor = await requireCapability("admin.shiftManagement"),
    now = new Date(),
    q = windowInput(value, now),
    where = { organisationId: actor.organisationId }
  const [employees, houses] = await Promise.all([
    database().user.findMany({
      where,
      select: {
        id: true,
        name: true,
        role: true,
        status: true,
        assignments: { where: { active: true }, select: { houseId: true } },
      },
      orderBy: { name: "asc" },
    }),
    database().house.findMany({
      where,
      select: { id: true, name: true, address: true, active: true },
      orderBy: { name: "asc" },
    }),
  ])
  if (q.house && !houses.some((h) => h.id === q.house))
    throw new AccessError(404)
  if (q.employee && !employees.some((e) => e.id === q.employee))
    throw new AccessError(404)
  const [shifts, detail] = await Promise.all([
    database().shift.findMany({
      where: {
        ...where,
        ...q.range,
        ...(q.house ? { houseId: q.house } : {}),
        ...(q.employee ? { employeeId: q.employee } : {}),
      },
      select,
      orderBy: [{ startsAt: "asc" }, { id: "asc" }],
    }),
    q.shiftId
      ? database().shift.findFirst({
          where: { ...where, id: q.shiftId },
          select,
        })
      : null,
  ])
  if (q.shiftId && !detail) throw new AccessError(404)
  return {
    now: now.toISOString(),
    day: q.day,
    month: q.month,
    shifts: shifts.map(dto),
    detail: detail ? dto(detail) : null,
    employees: employees.map((e) => ({
      id: e.id,
      name: e.name,
      role: e.role,
      active: e.status === "ACTIVE",
      houseIds: e.assignments.map((a) => a.houseId),
    })),
    houses,
  }
}
