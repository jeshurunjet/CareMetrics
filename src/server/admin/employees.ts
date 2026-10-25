import "server-only"
import { AccessError } from "../errors"
import {
  managementWrite,
  targetEmployee,
  audit,
  stamp,
  result,
  type Context,
} from "./transaction"
import {
  object,
  text,
  email,
  ids,
  expected,
  invalid,
  ManagementError,
} from "./validation"
const roles = ["STAFF", "SENIOR_STAFF", "MANAGER", "ADMINISTRATOR"] as const
const statuses = ["ACTIVE", "INACTIVE", "INVITED"] as const
function input(value: unknown) {
  const d = object(value, [
    "name",
    "employeeCode",
    "email",
    "role",
    "status",
    "houseIds",
    "expectedUpdatedAt",
  ])
  const role = text(d, "role", 30),
    status = text(d, "status", 20)
  if (!roles.includes(role as typeof roles[number]))
    invalid("role", "Choose a valid role.")
  if (!statuses.includes(status as typeof statuses[number]))
    invalid("status", "Choose a valid account state.")
  return {
    data: {
      name: text(d, "name", 160, true),
      employeeCode: text(d, "employeeCode", 40, true).toUpperCase(),
      email: email(d, true),
      role: role as typeof roles[number],
      status: status as typeof statuses[number],
    },
    houseIds: ids(d.houseIds),
    version: d.expectedUpdatedAt,
  }
}
async function assignments(
  ctx: Context,
  employeeId: string,
  houseIds: string[],
) {
  const { tx, actor } = ctx
  const current = await tx.employeeHouseAssignment.findMany({
    where: { organisationId: actor.organisationId, employeeId, active: true },
    select: { houseId: true },
  })
  const old = current.map((a) => a.houseId),
    removed = old.filter((id) => !houseIds.includes(id)),
    added = houseIds.filter((id) => !old.includes(id))
  const count = await tx.house.count({
    where: {
      id: { in: houseIds },
      organisationId: actor.organisationId,
      active: true,
    },
  })
  if (count !== houseIds.length)
    invalid("houseIds", "Choose active houses in your organisation.")
  if (
    removed.length &&
    (await tx.shift.count({
      where: {
        organisationId: actor.organisationId,
        employeeId,
        houseId: { in: removed },
        status: "SCHEDULED",
        endsAt: { gt: new Date() },
      },
    }))
  )
    throw new ManagementError(
      409,
      "This employee has scheduled shifts at this house. Review the roster before removing the assignment.",
    )
  if (removed.length)
    await tx.employeeHouseAssignment.updateMany({
      where: {
        organisationId: actor.organisationId,
        employeeId,
        houseId: { in: removed },
      },
      data: { active: false },
    })
  for (const houseId of added)
    await tx.employeeHouseAssignment.upsert({
      where: {
        organisationId_employeeId_houseId: {
          organisationId: actor.organisationId,
          employeeId,
          houseId,
        },
      },
      create: { organisationId: actor.organisationId, employeeId, houseId },
      update: { active: true },
    })
  if (added.length || removed.length)
    await audit(ctx, "assignments.updated", "assignments", employeeId, {
      addedHouseIds: added,
      removedHouseIds: removed,
    })
}
async function securityChange(
  ctx: Context,
  row: Awaited<ReturnType<typeof targetEmployee>>,
  role: typeof row.role,
  status: typeof row.status,
) {
  if (ctx.actor.role !== "ADMINISTRATOR" && role !== row.role)
    throw new AccessError(403)
  if (row.id === ctx.actor.id && (status !== "ACTIVE" || role !== row.role))
    throw new ManagementError(
      409,
      "Use another authorised Administrator to change your own access.",
    )
  if (
    row.role === "ADMINISTRATOR" &&
    row.status === "ACTIVE" &&
    (role !== "ADMINISTRATOR" || status !== "ACTIVE")
  ) {
    const admins = await ctx.tx.user.count({
      where: {
        organisationId: ctx.actor.organisationId,
        role: "ADMINISTRATOR",
        status: "ACTIVE",
      },
    })
    if (admins <= 1)
      throw new ManagementError(
        409,
        "The last active Administrator must be retained.",
      )
  }
  if (status === "ACTIVE" && !row.passwordHash)
    throw new ManagementError(
      409,
      "Secure credentials must be provisioned separately before activating this account.",
    )
}
export async function createEmployee(value: unknown) {
  return managementWrite("admin.employeeManagement", async (ctx) => {
    const f = input(value)
    if (
      ctx.actor.role !== "ADMINISTRATOR" &&
      !["STAFF", "SENIOR_STAFF"].includes(f.data.role)
    )
      throw new AccessError(403)
    if (f.data.status !== "INVITED")
      invalid(
        "status",
        "New employees require separate secure credential activation. Choose Invited.",
      )
    const row = await ctx.tx.user.create({
      data: { ...f.data, organisationId: ctx.actor.organisationId },
    })
    await assignments(ctx, row.id, f.houseIds)
    await audit(ctx, "employee.created", "employee", row.id, {
      fields: ["name", "employeeCode", "email", "role", "status"],
      credentialProvisioning: "required",
    })
    return result(row)
  })
}
export async function editEmployee(id: string, value: unknown) {
  return managementWrite("admin.employeeManagement", async (ctx) => {
    const row = await targetEmployee(ctx, id),
      f = input(value)
    expected(f.version, row.updatedAt)
    await securityChange(ctx, row, f.data.role, f.data.status)
    await assignments(ctx, row.id, f.houseIds)
    const updated = await ctx.tx.user.update({
      where: { id: row.id },
      data: { ...f.data, ...stamp(row) },
    })
    const fields = Object.keys(f.data).filter(
      (k) =>
        row[(k as keyof typeof row)] !== f.data[(k as keyof typeof f.data)],
    )
    await audit(ctx, "employee.updated", "employee", row.id, { fields })
    if (f.data.role !== row.role)
      await audit(ctx, "employee.role", "employee", row.id, {
        fromRole: row.role,
        toRole: f.data.role,
      })
    if (f.data.status !== row.status)
      await audit(ctx, "employee.status", "employee", row.id, {
        fromStatus: row.status,
        toStatus: f.data.status,
      })
    return result(updated)
  })
}
export async function setEmployeeStatus(id: string, value: unknown) {
  return managementWrite("admin.employeeManagement", async (ctx) => {
    const d = object(value, ["status", "expectedUpdatedAt"]),
      row = await targetEmployee(ctx, id),
      status = text(d, "status", 20)
    if (!["ACTIVE", "INACTIVE"].includes(status))
      invalid("status", "Choose Active or Inactive.")
    expected(d.expectedUpdatedAt, row.updatedAt)
    await securityChange(ctx, row, row.role, status as "ACTIVE" | "INACTIVE")
    const updated = await ctx.tx.user.update({
      where: { id: row.id },
      data: { status: status as "ACTIVE" | "INACTIVE", ...stamp(row) },
    })
    await audit(ctx, "employee.status", "employee", row.id, {
      fromStatus: row.status,
      toStatus: status,
    })
    return result(updated)
  })
}
export async function assignEmployeeHouses(id: string, value: unknown) {
  return managementWrite("admin.employeeManagement", async (ctx) => {
    const d = object(value, ["houseIds", "expectedUpdatedAt"]),
      row = await targetEmployee(ctx, id)
    expected(d.expectedUpdatedAt, row.updatedAt)
    await assignments(ctx, row.id, ids(d.houseIds))
    return result(
      await ctx.tx.user.update({ where: { id: row.id }, data: stamp(row) }),
    )
  })
}
