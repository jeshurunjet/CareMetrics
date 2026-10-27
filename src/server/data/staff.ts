import "server-only"
import { illustratedAvatar, housePhoto } from "@/lib/demo-media"
import { database } from "../db"
import { requireEmployee } from "../auth/access"
import { staffScope, requireClient, requireHouse } from "./access"
import { AccessError, entityId } from "../errors"
import type {
  HouseSummary,
  ClientSummary,
  EmployeeIdentity,
  StaffOverview,
  StaffSearch,
} from "@/modules/staff/read/types"
const houseFields = {
  imageKey: true,
  id: true,
  name: true,
  address: true,
  phone: true,
  email: true,
  _count: { select: { clients: { where: { active: true } } } },
} as const
const clientFields = {
  id: true,
  houseId: true,
  name: true,
  preferredName: true,
  house: { select: { name: true } },
} as const
const roleLabels: Record<string, string> = {
  STAFF: "Support Worker",
  SENIOR_STAFF: "Senior Staff",
  MANAGER: "Manager",
  ADMINISTRATOR: "Administrator",
}
function houseDto(h: {
  id: string
  name: string
  address: string
  phone: string | null
  email: string | null
  imageKey: string | null
  _count: { clients: number }
}): HouseSummary {
  return {
    id: h.id,
    name: h.name,
    address: h.address,
    phone: h.phone,
    email: h.email,
    clientCount: h._count.clients,
    photo: housePhoto(h.imageKey),
  }
}
function clientDto(c: {
  id: string
  houseId: string
  name: string
  preferredName: string | null
  house: { name: string }
}): ClientSummary {
  return {
    id: c.id,
    houseId: c.houseId,
    name: c.name,
    preferred: c.preferredName || c.name,
    photo: illustratedAvatar(c.id),
    houseName: c.house.name,
  }
}
export async function getCurrentStaff(): Promise<EmployeeIdentity> {
  const employee = await requireEmployee()
  const assignments = await database().employeeHouseAssignment.findMany({
    where: {
      organisationId: employee.organisationId,
      employeeId: employee.id,
      active: true,
      house: { active: true },
    },
    select: { house: { select: { id: true, name: true } } },
    orderBy: { house: { name: "asc" } },
  })
  const organisation = await database().organisation.findUniqueOrThrow({
    where: { id: employee.organisationId },
    select: { isFictionalDemo: true },
  })
  return {
    fictionalDemo: organisation.isFictionalDemo,
    photo: illustratedAvatar(employee.id),
    id: employee.id,
    name: employee.name,
    role: roleLabels[employee.role],
    roleCode: employee.role,
    employeeId: employee.employeeCode,
    email: employee.email,
    status:
      employee.status === "ACTIVE"
        ? "Active"
        : employee.status === "INVITED"
          ? "Invited"
          : "Inactive",
    assignedHouses: assignments.map((a) => a.house),
  }
}
export async function getStaffOverview(): Promise<StaffOverview> {
  const { employee, where } = await staffScope()
  const [identity, houses, clients] = await Promise.all([
    getCurrentStaff(),
    database().house.findMany({
      where,
      select: houseFields,
      orderBy: [{ name: "asc" }, { id: "asc" }],
    }),
    database().client.findMany({
      where: {
        organisationId: employee.organisationId,
        active: true,
        house: where,
      },
      select: clientFields,
      orderBy: [{ name: "asc" }, { id: "asc" }],
    }),
  ])
  return {
    employee: identity,
    houses: houses.map(houseDto),
    clients: clients.map(clientDto),
  }
}
export async function getHouseProfile(id: string) {
  await requireHouse(id)
  const { employee, where } = await staffScope()
  const house = await database().house.findFirst({
    where: { ...where, id: entityId(id) },
    select: houseFields,
  })
  if (!house) throw new AccessError(404)
  const clients = await database().client.findMany({
    where: {
      organisationId: employee.organisationId,
      houseId: house.id,
      active: true,
      house: where,
    },
    select: clientFields,
    orderBy: [{ name: "asc" }, { id: "asc" }],
  })
  return { house: houseDto(house), clients: clients.map(clientDto) }
}
export async function getClientProfile(id: string) {
  const client = await requireClient(id)
  const house = await requireHouse(client.houseId)
  return {
    id: client.id,
    houseId: house.id,
    name: client.name,
    preferred: client.preferredName || client.name,
    houseName: house.name,
    dob: client.dateOfBirth?.toISOString().slice(0, 10),
    summary: client.summary ?? undefined,
    contacts: client.contacts.map((k) => ({
      id: k.id,
      name: k.name,
      relation: k.relationship,
      phone: k.phone ?? undefined,
      email: k.email ?? undefined,
      primary: k.isPrimary,
      emergency: k.isEmergency,
    })),
  }
}
export function searchInput(input: unknown): string {
  if (input === undefined || input === null) return ""
  if (typeof input !== "string" || input.length > 120)
    throw new AccessError(400)
  return input.trim()
}
export async function searchStaff(input: unknown): Promise<StaffSearch> {
  const { employee, where } = await staffScope()
  const query = searchInput(input)
  const contains = { contains: query, mode: "insensitive" as const }
  const [houses, clients] = await Promise.all([
    database().house.findMany({
      where: { ...where, OR: [{ name: contains }, { address: contains }] },
      select: {
        ...houseFields,
        clients: { where: { active: true }, select: { name: true } },
      },
      orderBy: [{ name: "asc" }, { id: "asc" }],
    }),
    database().client.findMany({
      where: {
        organisationId: employee.organisationId,
        active: true,
        house: where,
        OR: [
          { name: contains },
          { preferredName: contains },
          { house: { name: contains } },
          { house: { address: contains } },
        ],
      },
      select: clientFields,
      orderBy: [{ name: "asc" }, { id: "asc" }],
    }),
  ])
  return {
    query,
    houses: houses.map((h) => ({
      ...houseDto(h),
      clientNames: h.clients.map((c) => c.name),
    })),
    clients: clients.map(clientDto),
  }
}
