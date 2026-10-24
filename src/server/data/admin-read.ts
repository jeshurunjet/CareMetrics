import "server-only"
import { requireManagement } from "../auth/access"
import { database } from "../db"
import { entityId, AccessError } from "../errors"
import { getStaffOverview, getHouseProfile, getClientProfile } from "./staff"
const employeeFields = {
  id: true,
  name: true,
  employeeCode: true,
  email: true,
  role: true,
  status: true,
  assignments: {
    where: { active: true, house: { active: true } },
    select: { house: { select: { id: true, name: true } } },
  },
} as const
export async function getManagementRecords() {
  const employee = await requireManagement()
  const [employees, overview] = await Promise.all([
    database().user.findMany({
      where: { organisationId: employee.organisationId },
      select: employeeFields,
      orderBy: [{ name: "asc" }, { id: "asc" }],
    }),
    getStaffOverview(),
  ])
  return { employees, houses: overview.houses, clients: overview.clients }
}
export async function getManagementEmployee(id: string) {
  const employee = await requireManagement()
  const result = await database().user.findFirst({
    where: { id: entityId(id), organisationId: employee.organisationId },
    select: employeeFields,
  })
  if (!result) throw new AccessError(404)
  return result
}
export async function getManagementHouse(id: string) {
  await requireManagement()
  return getHouseProfile(id)
}
export async function getManagementClient(id: string) {
  await requireManagement()
  return getClientProfile(id)
}
