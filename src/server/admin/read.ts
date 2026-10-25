import "server-only"
import { database } from "../db"
import { requireManagement } from "../auth/access"
import { AccessError, entityId } from "../errors"
const employeeSelect = {
  id: true,
  name: true,
  employeeCode: true,
  email: true,
  role: true,
  status: true,
  updatedAt: true,
  assignments: {
    where: { active: true },
    select: { house: { select: { id: true, name: true } } },
  },
} as const
const houseSelect = {
  id: true,
  name: true,
  code: true,
  address: true,
  phone: true,
  email: true,
  active: true,
  latitude: true,
  longitude: true,
  updatedAt: true,
  _count: {
    select: {
      clients: { where: { active: true } },
      assignments: { where: { active: true } },
    },
  },
} as const
const clientSelect = {
  id: true,
  name: true,
  preferredName: true,
  reference: true,
  houseId: true,
  active: true,
  updatedAt: true,
  house: { select: { name: true } },
} as const
export async function managementDirectory() {
  const actor = await requireManagement(),
    where = { organisationId: actor.organisationId }
  const [employees, houses, clients] = await Promise.all([
    database().user.findMany({
      where,
      select: employeeSelect,
      orderBy: [{ name: "asc" }, { id: "asc" }],
    }),
    database().house.findMany({
      where,
      select: houseSelect,
      orderBy: [{ name: "asc" }, { id: "asc" }],
    }),
    database().client.findMany({
      where,
      select: clientSelect,
      orderBy: [{ name: "asc" }, { id: "asc" }],
    }),
  ])
  return {
    actor: { id: actor.id, role: actor.role },
    employees: employees.map((e) => ({
      ...e,
      updatedAt: e.updatedAt.toISOString(),
    })),
    houses: houses.map((h) => ({
      ...h,
      latitude: h.latitude === null ? null : Number(h.latitude),
      longitude: h.longitude === null ? null : Number(h.longitude),
      updatedAt: h.updatedAt.toISOString(),
    })),
    clients: clients.map((c) => ({
      ...c,
      updatedAt: c.updatedAt.toISOString(),
    })),
  }
}
export async function employeeEditor(id?: string) {
  const actor = await requireManagement()
  const [row, houses] = await Promise.all([
    id
      ? database().user.findFirst({
          where: { id: entityId(id), organisationId: actor.organisationId },
          select: { ...employeeSelect, passwordHash: true },
        })
      : null,
    database().house.findMany({
      where: { organisationId: actor.organisationId, active: true },
      select: {
        id: true,
        name: true,
        address: true,
        _count: { select: { clients: { where: { active: true } } } },
      },
      orderBy: { name: "asc" },
    }),
  ])
  if (id && !row) throw new AccessError(404)
  return {
    actor: { id: actor.id, role: actor.role },
    houses: houses.map((h) => ({
      id: h.id,
      name: h.name,
      address: h.address,
      clientCount: h._count.clients,
    })),
    employee: row
      ? {
          id: row.id,
          name: row.name,
          employeeCode: row.employeeCode,
          email: row.email,
          role: row.role,
          status: row.status,
          hasCredentials: !!row.passwordHash,
          houseIds: row.assignments.map((a) => a.house.id),
          assignedHouses: row.assignments.map((a) => a.house),
          updatedAt: row.updatedAt.toISOString(),
        }
      : null,
  }
}
export async function houseEditor(id?: string) {
  const actor = await requireManagement()
  const row = id
    ? await database().house.findFirst({
        where: { id: entityId(id), organisationId: actor.organisationId },
        select: houseSelect,
      })
    : null
  if (id && !row) throw new AccessError(404)
  return {
    actor: { id: actor.id, role: actor.role },
    house: row
      ? {
          ...row,
          latitude: row.latitude === null ? null : Number(row.latitude),
          longitude: row.longitude === null ? null : Number(row.longitude),
          updatedAt: row.updatedAt.toISOString(),
        }
      : null,
  }
}
export async function clientEditor(id?: string) {
  const actor = await requireManagement()
  const [row, houses] = await Promise.all([
    id
      ? database().client.findFirst({
          where: { id: entityId(id), organisationId: actor.organisationId },
          select: {
            ...clientSelect,
            dateOfBirth: true,
            summary: true,
            contacts: {
              select: {
                id: true,
                name: true,
                relationship: true,
                phone: true,
                email: true,
                isPrimary: true,
                isEmergency: true,
              },
              orderBy: [{ isPrimary: "desc" }, { id: "asc" }],
            },
          },
        })
      : null,
    database().house.findMany({
      where: { organisationId: actor.organisationId },
      select: {
        id: true,
        name: true,
        address: true,
        active: true,
        _count: { select: { clients: { where: { active: true } } } },
      },
      orderBy: { name: "asc" },
    }),
  ])
  if (id && !row) throw new AccessError(404)
  return {
    actor: { id: actor.id, role: actor.role },
    houses: houses.map((h) => ({
      id: h.id,
      name: h.name,
      address: h.address,
      status: h.active ? "Active" : "Inactive",
      clientCount: h._count.clients,
    })),
    client: row
      ? {
          ...row,
          dateOfBirth: row.dateOfBirth?.toISOString().slice(0, 10) ?? "",
          updatedAt: row.updatedAt.toISOString(),
        }
      : null,
  }
}
