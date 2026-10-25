import { clockOutPolicy } from "../attendance/out-policy"
import { attendancePolicy } from "../attendance/policy"
import "server-only"
import { auth } from "./index"
import { database } from "../db"
import { isBackendEnabled } from "../config/backend"
import { AccessError } from "../errors"
import type { Role } from "@/generated/prisma/enums"
export const employeeSelect = {
  id: true,
  organisationId: true,
  employeeCode: true,
  name: true,
  role: true,
  email: true,
  status: true,
} as const
export async function requireEmployee() {
  if (!isBackendEnabled()) throw new AccessError(503)
  const session = await auth()
  if (!session?.user?.id) throw new AccessError(401)
  const employee = await database().user.findFirst({
    where: {
      id: session.user.id,
      sessionVersion: session.user.sessionVersion,
      status: "ACTIVE",
      organisation: { active: true },
    },
    select: employeeSelect,
  })
  if (!employee) throw new AccessError(401)
  return employee
}
export function isManagement(role: Role) {
  return role === "ADMINISTRATOR" || role === "MANAGER"
}
export async function requireManagement() {
  const employee = await requireEmployee()
  if (!isManagement(employee.role)) throw new AccessError(403)
  return employee
}
export async function requireCapability(capability: string) {
  const employee = await requireEmployee()
  const allowed =
    capability === "staff.assignedData" ||
    (capability === "attendance.clockOut" &&
      clockOutPolicy(employee.organisationId)?.mode ===
        "NO_LOCATION_REQUIRED") ||
    (capability === "attendance.gpsClockIn" &&
      !!attendancePolicy(employee.organisationId)) ||
    ([
      "admin.foundation",
      "admin.attendanceViewing",
      "admin.employeeManagement",
      "admin.houseManagement",
      "admin.clientManagement",
      "admin.shiftManagement",
    ].includes(capability) &&
      isManagement(employee.role)) ||
    (capability === "admin.accountAdministration" &&
      employee.role === "ADMINISTRATOR")
  if (!allowed) throw new AccessError(403)
  return employee
}
