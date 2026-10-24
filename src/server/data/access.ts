import "server-only"
import { database } from "../db"
import { requireEmployee, isManagement } from "../auth/access"
import { AccessError, entityId } from "../errors"
const houseSelect = {
  id: true,
  name: true,
  address: true,
  phone: true,
  email: true,
} as const
const clientSelect = {
  id: true,
  houseId: true,
  name: true,
  preferredName: true,
  reference: true,
  dateOfBirth: true,
  summary: true,
} as const
export async function staffScope() {
  const employee = await requireEmployee()
  return {
    employee,
    where: {
      organisationId: employee.organisationId,
      active: true,
      ...(isManagement(employee.role)
        ? {}
        : { assignments: { some: { employeeId: employee.id, active: true } } }),
    },
  }
}
export async function getAssignedHouses() {
  const { where } = await staffScope()
  return database().house.findMany({
    where,
    select: houseSelect,
    orderBy: [{ name: "asc" }, { id: "asc" }],
    take: 100,
  })
}
export async function requireHouse(id: string) {
  const { where } = await staffScope()
  const house = await database().house.findFirst({
    where: { ...where, id: entityId(id) },
    select: houseSelect,
  })
  if (!house) throw new AccessError(404)
  return house
}
export async function getHouseClients(id: string) {
  const { employee, where } = await staffScope()
  return database().client.findMany({
    where: {
      organisationId: employee.organisationId,
      houseId: entityId(id),
      active: true,
      house: where,
    },
    select: clientSelect,
    orderBy: [{ name: "asc" }, { id: "asc" }],
    take: 100,
  })
}
export async function requireClient(id: string) {
  const { employee, where } = await staffScope()
  const client = await database().client.findFirst({
    where: {
      id: entityId(id),
      organisationId: employee.organisationId,
      active: true,
      house: where,
    },
    select: {
      ...clientSelect,
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
  if (!client) throw new AccessError(404)
  return client
}
