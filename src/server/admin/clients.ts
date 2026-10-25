import "server-only"
import { entityId } from "../errors"
import {
  changedFields,
  managementWrite,
  targetClient,
  targetHouse,
  audit,
  stamp,
  result,
  type Context,
} from "./transaction"
import {
  object,
  text,
  email,
  phone,
  boolean,
  expected,
  ids,
  dateOnly,
  invalid,
  ManagementError,
} from "./validation"
function input(value: unknown) {
  const d = object(value, [
    "name",
    "preferredName",
    "reference",
    "dateOfBirth",
    "summary",
    "houseId",
    "active",
    "expectedUpdatedAt",
    "contacts",
    "confirmedRemovalIds",
  ])
  return {
    data: {
      name: text(d, "name", 160, true),
      preferredName: text(d, "preferredName", 160) || null,
      reference: text(d, "reference", 40, true).toUpperCase(),
      dateOfBirth: dateOnly(text(d, "dateOfBirth", 10)),
      summary: text(d, "summary", 4000) || null,
      houseId: entityId(d.houseId),
      active: boolean(d, "active"),
    },
    version: d.expectedUpdatedAt,
    contacts: d.contacts,
    confirmedRemovalIds: d.confirmedRemovalIds,
  }
}
export async function createClient(value: unknown) {
  return managementWrite("admin.clientManagement", async (ctx) => {
    const f = input(value)
    await targetHouse(ctx, f.data.houseId, true)
    const row = await ctx.tx.client.create({
      data: { ...f.data, organisationId: ctx.actor.organisationId },
    })
    await audit(ctx, "client.created", "client", row.id, {
      fields: Object.keys(f.data),
      houseId: row.houseId,
    })
    if (f.contacts !== undefined)
      return contacts(ctx, row.id, {
        contacts: f.contacts,
        confirmedRemovalIds: f.confirmedRemovalIds ?? [],
        expectedUpdatedAt: row.updatedAt.toISOString(),
      })
    return result(row)
  })
}
export async function editClient(id: string, value: unknown) {
  return managementWrite("admin.clientManagement", async (ctx) => {
    const row = await targetClient(ctx, id),
      f = input(value)
    expected(f.version, row.updatedAt)
    if (f.data.houseId !== row.houseId)
      throw new ManagementError(
        409,
        "Use the confirmed house transfer to change this client's house.",
      )
    await targetHouse(ctx, row.houseId, f.data.active)
    const updated = await ctx.tx.client.update({
      where: { id: row.id },
      data: { ...f.data, ...stamp(row) },
    })
    await audit(ctx, "client.updated", "client", row.id, {
      fields: changedFields(row, f.data).filter((k) => k !== "houseId"),
    })
    if (row.active !== f.data.active)
      await audit(ctx, "client.status", "client", row.id, {
        active: f.data.active,
      })
    if (f.contacts !== undefined)
      return contacts(ctx, row.id, {
        contacts: f.contacts,
        confirmedRemovalIds: f.confirmedRemovalIds ?? [],
        expectedUpdatedAt: updated.updatedAt.toISOString(),
      })
    return result(updated)
  })
}
export async function transferClient(id: string, value: unknown) {
  return managementWrite("admin.clientManagement", async (ctx) => {
    const d = object(value, ["houseId", "confirmed", "expectedUpdatedAt"]),
      row = await targetClient(ctx, id)
    expected(d.expectedUpdatedAt, row.updatedAt)
    if (d.confirmed !== true)
      invalid("confirmed", "Review and confirm the transfer.")
    const house = await targetHouse(ctx, entityId(d.houseId), true)
    if (house.id === row.houseId)
      throw new ManagementError(409, "Choose a different house.")
    const updated = await ctx.tx.client.update({
      where: { id: row.id },
      data: { houseId: house.id, ...stamp(row) },
    })
    await audit(ctx, "client.transferred", "client", row.id, {
      fromHouseId: row.houseId,
      toHouseId: house.id,
    })
    return result(updated)
  })
}
async function contacts(ctx: Context, clientId: string, value: unknown) {
  const d = object(value, [
      "contacts",
      "confirmedRemovalIds",
      "expectedUpdatedAt",
    ]),
    row = await targetClient(ctx, clientId)
  expected(d.expectedUpdatedAt, row.updatedAt)
  if (!Array.isArray(d.contacts) || d.contacts.length > 30)
    invalid("contacts", "Use at most 30 contacts.")
  const parsed = d.contacts.map((value) => {
    const c = object(value, [
      "id",
      "name",
      "relationship",
      "phone",
      "email",
      "isPrimary",
      "isEmergency",
    ])
    return {
      id: c.id === undefined ? undefined : entityId(c.id),
      name: text(c, "name", 160, true),
      relationship: text(c, "relationship", 100, true),
      phone: phone(c) || null,
      email: email(c) || null,
      isPrimary: boolean(c, "isPrimary"),
      isEmergency: boolean(c, "isEmergency"),
    }
  })
  const provided = parsed.flatMap((c) => (c.id ? [c.id] : []))
  if (
    new Set(provided).size !== provided.length ||
    parsed.filter((c) => c.isPrimary).length > 1
  )
    invalid("contacts", "Use unique contacts and at most one primary contact.")
  const old = await ctx.tx.clientContact.findMany({
    where: { organisationId: ctx.actor.organisationId, clientId: row.id },
  })
  if (provided.some((id) => !old.some((c) => c.id === id)))
    invalid("contacts", "A contact is not part of this client.")
  const removed = old.filter((c) => !provided.includes(c.id)).map((c) => c.id),
    confirmed = ids(d.confirmedRemovalIds)
  if (
    removed.some((id) => !confirmed.includes(id)) ||
    confirmed.some((id) => !removed.includes(id))
  )
    throw new ManagementError(
      409,
      "Confirm each removed contact and review primary/emergency replacement arrangements before saving.",
    )
  // Clear primary first so switching it is compatible with the partial unique index.
  await ctx.tx.clientContact.updateMany({
    where: {
      organisationId: ctx.actor.organisationId,
      clientId: row.id,
      isPrimary: true,
    },
    data: { isPrimary: false },
  })
  if (removed.length)
    await ctx.tx.clientContact.deleteMany({
      where: {
        organisationId: ctx.actor.organisationId,
        clientId: row.id,
        id: { in: removed },
      },
    })
  for (const { id, ...data } of parsed) {
    if (id) await ctx.tx.clientContact.update({ where: { id }, data })
    else
      await ctx.tx.clientContact.create({
        data: {
          ...data,
          organisationId: ctx.actor.organisationId,
          clientId: row.id,
        },
      })
  }
  const updated = await ctx.tx.client.update({
    where: { id: row.id },
    data: stamp(row),
  })
  await audit(ctx, "contacts.updated", "contacts", row.id, {
    added: parsed.filter((c) => !c.id).length,
    updated: provided.length,
    removedContactIds: removed,
    primarySelected: parsed.some((c) => c.isPrimary),
    emergencyContacts: parsed.filter((c) => c.isEmergency).length,
  })
  return result(updated)
}
export async function saveClientContacts(id: string, value: unknown) {
  return managementWrite("admin.clientManagement", (ctx) =>
    contacts(ctx, id, value),
  )
}
