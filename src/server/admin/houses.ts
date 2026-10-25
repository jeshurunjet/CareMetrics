import "server-only"
import {
  changedFields,
  managementWrite,
  targetHouse,
  audit,
  stamp,
  result,
} from "./transaction"
import {
  object,
  text,
  email,
  phone,
  boolean,
  expected,
  invalid,
  ManagementError,
} from "./validation"
function input(value: unknown) {
  const d = object(value, [
    "name",
    "code",
    "address",
    "phone",
    "email",
    "active",
    "latitude",
    "longitude",
    "expectedUpdatedAt",
  ])
  const lat = d.latitude,
    lng = d.longitude
  if (
    !(lat === null && lng === null) &&
    !(
      typeof lat === "number" &&
      Number.isFinite(lat) &&
      Math.abs(lat) <= 90 &&
      typeof lng === "number" &&
      Number.isFinite(lng) &&
      Math.abs(lng) <= 180
    )
  )
    invalid(
      "latitude",
      "Enter both finite coordinates within latitude ±90 and longitude ±180, or leave both blank.",
    )
  return {
    data: {
      name: text(d, "name", 160, true),
      code: text(d, "code", 40, true).toUpperCase(),
      address: text(d, "address", 300, true),
      phone: phone(d) || null,
      email: email(d) || null,
      active: boolean(d, "active"),
      latitude: lat as number | null,
      longitude: lng as number | null,
    },
    version: d.expectedUpdatedAt,
  }
}
export async function createHouse(value: unknown) {
  return managementWrite("admin.houseManagement", async (ctx) => {
    const f = input(value),
      row = await ctx.tx.house.create({
        data: { ...f.data, organisationId: ctx.actor.organisationId },
      })
    await audit(ctx, "house.created", "house", row.id, {
      fields: Object.keys(f.data),
      coordinatesVerified: false,
    })
    return result(row)
  })
}
export async function editHouse(id: string, value: unknown) {
  return managementWrite("admin.houseManagement", async (ctx) => {
    const row = await targetHouse(ctx, id),
      f = input(value)
    expected(f.version, row.updatedAt)
    if (!f.data.active && row.active) {
      const [clients, assignments, shifts] = await Promise.all([
        ctx.tx.client.count({
          where: {
            organisationId: ctx.actor.organisationId,
            houseId: row.id,
            active: true,
          },
        }),
        ctx.tx.employeeHouseAssignment.count({
          where: {
            organisationId: ctx.actor.organisationId,
            houseId: row.id,
            active: true,
          },
        }),
        ctx.tx.shift.count({
          where: {
            organisationId: ctx.actor.organisationId,
            houseId: row.id,
            status: "SCHEDULED",
            endsAt: { gt: new Date() },
          },
        }),
      ])
      if (clients || assignments || shifts)
        throw new ManagementError(
          409,
          "This house has active clients, assignments or scheduled shifts. Resolve those dependencies before deactivation.",
        )
    }
    const updated = await ctx.tx.house.update({
      where: { id: row.id },
      data: { ...f.data, ...stamp(row) },
    })
    await audit(ctx, "house.updated", "house", row.id, {
      fields: changedFields(row, f.data),
      coordinatesVerified: false,
    })
    if (row.active !== f.data.active)
      await audit(ctx, "house.status", "house", row.id, {
        active: f.data.active,
      })
    return result(updated)
  })
}
