import { effectiveAttendance } from "../../staff/roster/effective"
import { staffJobRoles } from "../../staff/data/permissions"
import type { StaffSnapshot, ClientContact } from "@/modules/staff/data/types"
import type { PreviewRole } from "@/modules/preview/context"
import { validDay, nzDay } from "../../staff/roster/dates"
import type { EmployeeInput, HouseInput, ClientInput, Errors } from "./types"
export const roles: readonly string[] = staffJobRoles

export function canManage(role: string) {
  return role === "Administrator" || role === "Manager"
}
export function requireManagement(role: string) {
  if (!canManage(role))
    throw new Error("Management preview permission required.")
}
function targetAccount(s: StaffSnapshot, role: string, id?: string) {
  requireManagement(role)
  const target = id ? s.staff.find((e) => e.id === id) : undefined
  if (id && !target) throw new Error("Employee unavailable.")
  if (target?.role === "Administrator" && role !== "Administrator")
    throw new Error("Administrator accounts require an Administrator.")
  return target
}
const email = (v: string) => /^\S+@\S+\.\S+$/.test(v)
const phone = (v: string) =>
  !v ||
  (/^\+?[0-9 ()-]+$/.test(v) &&
    /^[0-9]{7,15}$/.test(v.replace(/\D/g, "")) &&
    v.length <= 32)
function shape(
  input: unknown,
  keys: string[],
): input is Record<string, string> {
  return (
    !!input &&
    typeof input === "object" &&
    !Array.isArray(input) &&
    Object.keys(input).every((k) => keys.includes(k)) &&
    keys.every((k) => typeof (input as Record<string, unknown>)[k] === "string")
  )
}
const employeeFields = [
  "first",
  "last",
  "preferred",
  "employeeId",
  "email",
  "phone",
  "address",
  "emergency",
  "role",
  "status",
  "started",
]
export function assignmentConflict(
  s: StaffSnapshot,
  employeeId: string,
  houseIds: string[],
) {
  const removed = s.assignments.filter(
    (a) => a.employeeId === employeeId && !houseIds.includes(a.houseId),
  )
  return s.shifts.some(
    (sh) =>
      sh.staffId === employeeId &&
      sh.status !== "cancelled" &&
      Date.parse(sh.end) > Date.parse(s.now) &&
      removed.some((a) => a.houseId === sh.houseId),
  )
}
export function validateEmployee(
  s: StaffSnapshot,
  role: string,
  input: unknown,
  id?: string,
): Errors {
  const errors: Errors = {}
  try {
    targetAccount(s, role, id)
  } catch (e) {
    return { form: (e as Error).message }
  }
  if (!input || typeof input !== "object")
    return { form: "Invalid employee details." }
  const { houses, ...fields } = input as EmployeeInput
  if (
    !shape(fields, employeeFields) ||
    !Array.isArray(houses) ||
    houses.some((h) => typeof h !== "string")
  )
    return { form: "Unsupported employee fields." }
  const f = fields as Omit<EmployeeInput, "houses">
  if (!f.first.trim() || f.first.length > 80)
    errors.first = "Enter a first name (up to 80 characters)."
  if (!f.last.trim() || f.last.length > 80)
    errors.last = "Enter a last name (up to 80 characters)."
  if (
    !f.employeeId.trim() ||
    f.employeeId.length > 40 ||
    s.staff.some(
      (e) =>
        e.id !== id &&
        e.employeeId.toLowerCase() === f.employeeId.trim().toLowerCase(),
    )
  )
    errors.employeeId = "Employee ID is required and must be unique."
  if (
    !email(f.email.trim()) ||
    f.email.length > 254 ||
    s.staff.some(
      (e) =>
        e.id !== id && e.email.toLowerCase() === f.email.trim().toLowerCase(),
    )
  )
    errors.email = "Enter a unique valid email address."
  if (
    !roles.includes(f.role) ||
    (role !== "Administrator" && f.role === "Administrator")
  )
    errors.role = "Only Administrators can grant the Administrator role."
  if (!["Active", "Inactive", "Invited"].includes(f.status))
    errors.status = "Choose a supported account status."
  if (!phone(f.phone.trim())) errors.phone = "Enter a valid phone number."
  if (
    f.preferred.length > 80 ||
    f.address.length > 240 ||
    f.emergency.length > 160
  )
    errors.form = "Personal contact details are too long."
  if (f.started && !validDay(f.started))
    errors.started = "Enter a valid start date."
  if (
    new Set(houses).size !== houses.length ||
    houses.some((h) => !s.houses.some((x) => x.id === h))
  )
    errors.houses = "Choose existing houses without duplicates."
  if (id && assignmentConflict(s, id, houses))
    errors.houses =
      "This employee has scheduled shifts at this house. Review the roster before removing the assignment."
  return errors
}
function assertValid(errors: Errors) {
  if (Object.keys(errors).length)
    throw new Error(Object.values(errors).join(" "))
}
export function saveEmployee(
  s: StaffSnapshot,
  role: PreviewRole,
  f: EmployeeInput,
  id?: string,
) {
  assertValid(validateEmployee(s, role, f, id))
  const employeeId = id ?? crypto.randomUUID(),
    previous = s.staff.find((e) => e.id === employeeId)
  const employee = {
    ...previous,
    id: employeeId,
    name: `${f.first.trim()} ${f.last.trim()}`,
    preferred: f.preferred.trim(),
    employeeId: f.employeeId.trim(),
    email: f.email.trim(),
    phone: f.phone.trim(),
    address: f.address.trim(),
    emergency: f.emergency.trim(),
    role: f.role,
    status: f.status as "Active" | "Inactive" | "Invited",
    started: f.started,
  }
  return {
    data: {
      ...s,
      staff: previous
        ? s.staff.map((e) => (e.id === employeeId ? employee : e))
        : [...s.staff, employee],
      assignments: [
        ...s.assignments.filter((a) => a.employeeId !== employeeId),
        ...f.houses.map((houseId) => ({ employeeId, houseId })),
      ],
    },
    id: employeeId,
  }
}
export function assignHouses(
  s: StaffSnapshot,
  role: PreviewRole,
  id: string,
  houses: string[],
) {
  const target = targetAccount(s, role, id)!
  if (
    !Array.isArray(houses) ||
    houses.some(
      (h) => typeof h !== "string" || !s.houses.some((x) => x.id === h),
    ) ||
    new Set(houses).size !== houses.length
  )
    throw new Error("Invalid house assignment.")
  if (assignmentConflict(s, target.id, houses))
    throw new Error(
      "This employee has scheduled shifts at this house. Review the roster before removing the assignment.",
    )
  return {
    ...s,
    assignments: [
      ...s.assignments.filter((a) => a.employeeId !== id),
      ...houses.map((houseId) => ({ employeeId: id, houseId })),
    ],
  }
}
export function setEmployeeStatus(
  s: StaffSnapshot,
  role: PreviewRole,
  id: string,
  status: "Active" | "Inactive",
) {
  targetAccount(s, role, id)
  if (!["Active", "Inactive"].includes(status))
    throw new Error("Invalid status.")
  return {
    ...s,
    staff: s.staff.map((e) => (e.id === id ? { ...e, status } : e)),
  }
}
const houseFields = [
  "name",
  "code",
  "address",
  "suburb",
  "phone",
  "email",
  "description",
  "manager",
  "status",
  "lat",
  "lng",
  "geofence",
]
export function validateHouse(
  s: StaffSnapshot,
  role: string,
  input: unknown,
  id?: string,
): Errors {
  if (!canManage(role))
    return { form: "Management preview permission required." }
  if (id && !s.houses.some((h) => h.id === id))
    return { form: "House unavailable." }
  if (!shape(input, houseFields)) return { form: "Unsupported house fields." }
  const f = input as unknown as HouseInput,
    errors: Errors = {}
  if (!f.name.trim() || f.name.length > 120)
    errors.name = "Enter a house name (up to 120 characters)."
  if (
    !f.code.trim() ||
    f.code.length > 40 ||
    s.houses.some(
      (h) =>
        h.id !== id && h.code?.toLowerCase() === f.code.trim().toLowerCase(),
    )
  )
    errors.code = "A unique house code is required."
  if (!f.address.trim() || f.address.length > 240)
    errors.address = "Enter an address (up to 240 characters)."
  if (!f.phone.trim() || !phone(f.phone.trim()))
    errors.phone = "Enter a contact phone number."
  if (f.email && !email(f.email.trim()))
    errors.email = "Enter a valid email address."
  if (f.lat || f.lng) {
    if (
      !f.lat.trim() ||
      !f.lng.trim() ||
      !Number.isFinite(Number(f.lat)) ||
      !Number.isFinite(Number(f.lng)) ||
      Number(f.lat) < -90 ||
      Number(f.lat) > 90 ||
      Number(f.lng) < -180 ||
      Number(f.lng) > 180
    )
      errors.lat = "Enter a valid latitude and longitude pair."
  }
  if (
    f.geofence &&
    (!Number.isFinite(Number(f.geofence)) || Number(f.geofence) <= 0)
  )
    errors.geofence = "Use a positive provisional radius or leave it blank."
  if (!["Active", "Inactive"].includes(f.status))
    errors.status = "Choose Active or Inactive."
  if (
    f.suburb.length > 120 ||
    f.description.length > 2000 ||
    f.manager.length > 160
  )
    errors.form = "House information is too long."
  return errors
}
export function saveHouse(
  s: StaffSnapshot,
  role: PreviewRole,
  f: HouseInput,
  id?: string,
) {
  assertValid(validateHouse(s, role, f, id))
  const houseId = id ?? crypto.randomUUID(),
    previous = s.houses.find((h) => h.id === houseId)
  const rec = {
    ...previous,
    id: houseId,
    name: f.name.trim(),
    code: f.code.trim(),
    address: f.address.trim(),
    suburb: f.suburb.trim(),
    phone: f.phone.trim(),
    email: f.email.trim(),
    description: f.description.trim(),
    manager: f.manager.trim(),
    status: f.status as "Active" | "Inactive",
    lat: f.lat ? Number(f.lat) : 0,
    lng: f.lng ? Number(f.lng) : 0,
    locationSet: !!f.lat && !!f.lng,
    geofence: f.geofence ? Number(f.geofence) : null,
    photo: previous?.photo ?? "/demo-assets/room-demo.png",
  }
  return {
    data: {
      ...s,
      houses: previous
        ? s.houses.map((h) => (h.id === houseId ? rec : h))
        : [...s.houses, rec],
    },
    id: houseId,
  }
}
const clientFields = [
  "first",
  "last",
  "preferred",
  "dob",
  "ref",
  "nhi",
  "houseId",
  "summary",
  "status",
  "alerts",
]
export function validateClient(
  s: StaffSnapshot,
  role: string,
  input: unknown,
  id?: string,
): Errors {
  if (!canManage(role))
    return { form: "Management preview permission required." }
  if (id && !s.clients.some((c) => c.id === id))
    return { form: "Client unavailable." }
  if (!shape(input, clientFields)) return { form: "Unsupported client fields." }
  const f = input as unknown as ClientInput,
    errors: Errors = {}
  if (!f.first.trim() || f.first.length > 80)
    errors.first = "First name is required (up to 80 characters)."
  if (!f.last.trim() || f.last.length > 80)
    errors.last = "Last name is required (up to 80 characters)."
  if (
    !f.ref.trim() ||
    f.ref.length > 40 ||
    s.clients.some(
      (c) => c.id !== id && c.ref?.toLowerCase() === f.ref.trim().toLowerCase(),
    )
  )
    errors.ref = "A unique client reference is required."
  if (!s.houses.some((h) => h.id === f.houseId && h.status !== "Inactive"))
    errors.houseId = "Choose one active house."
  if (id && s.clients.find((c) => c.id === id)?.houseId !== f.houseId)
    errors.houseId = "Use the confirmed House assignment transfer workflow."
  if (f.dob && (!validDay(f.dob) || f.dob > nzDay(s.now)))
    errors.dob = "Enter a valid date of birth, no later than today."
  // Retain the export's demonstration format only; not a verified health identifier service.
  if (f.nhi && !/^(?:[A-Z]{3}\d{4}|[A-Z]{3}\d{2}[A-Z]{2})$/.test(f.nhi))
    errors.nhi =
      "Use the prototype identifier format: three letters + four digits, or three letters + two digits + two letters."
  if (!["Active", "Inactive"].includes(f.status))
    errors.status = "Choose Active or Inactive."
  if (
    f.preferred.length > 80 ||
    f.summary.length > 4000 ||
    f.alerts.length > 2000
  )
    errors.form = "Client information is too long."
  return errors
}
export function validateContacts(input: unknown): Errors {
  if (!Array.isArray(input)) return { contacts: "Invalid contacts." }
  if (input.filter((c) => c?.primary).length > 1)
    return { contacts: "Only one primary contact is permitted." }
  const ids = new Set<string>()
  for (const c of input as ClientContact[]) {
    if (
      !c ||
      typeof c !== "object" ||
      Object.keys(c).some(
        (k) =>
          ![
            "id",
            "name",
            "relation",
            "phone",
            "email",
            "address",
            "notes",
            "primary",
            "emergency",
          ].includes(k),
      ) ||
      typeof c.id !== "string" ||
      !c.id ||
      ids.has(c.id)
    )
      return {
        contacts: "Contacts need distinct stable IDs and supported fields.",
      }
    ids.add(c.id)
    if (
      typeof c.name !== "string" ||
      !c.name.trim() ||
      c.name.length > 160 ||
      typeof c.relation !== "string" ||
      !c.relation.trim() ||
      c.relation.length > 160
    )
      return { contacts: "Complete each contact's name and relationship." }
    for (const key of ["phone", "email", "address", "notes"] as const)
      if (
        c[key] !== undefined &&
        (typeof c[key] !== "string" ||
          c[key]!.length > (key === "notes" ? 1000 : 240))
      )
        return { contacts: "Invalid contact details." }
    if (
      (c.phone && !phone(c.phone.trim())) ||
      (c.email && !email(c.email.trim()))
    )
      return { contacts: "Enter valid contact phone/email details." }
    if (
      (c.primary !== undefined && typeof c.primary !== "boolean") ||
      (c.emergency !== undefined && typeof c.emergency !== "boolean")
    )
      return { contacts: "Invalid contact flags." }
  }
  return {}
}
export function saveClient(
  s: StaffSnapshot,
  role: PreviewRole,
  f: ClientInput,
  contacts: ClientContact[],
  id?: string,
) {
  assertValid({
    ...validateClient(s, role, f, id),
    ...validateContacts(contacts),
  })
  const clientId = id ?? crypto.randomUUID(),
    previous = s.clients.find((c) => c.id === clientId)
  const rec = {
    ...previous,
    id: clientId,
    name: `${f.first.trim()} ${f.last.trim()}`,
    preferred: f.preferred.trim() || f.first.trim(),
    dob: f.dob,
    ref: f.ref.trim(),
    nhi: f.nhi.trim(),
    houseId: f.houseId,
    summary: f.summary.trim(),
    status: f.status as "Active" | "Inactive",
    alerts: f.alerts
      .split("\n")
      .map((a) => a.trim())
      .filter(Boolean),
    contacts: contacts.map((c) => ({ ...c })),
    tone: previous?.tone ?? "#1a6b7a",
  }
  return {
    data: {
      ...s,
      clients: previous
        ? s.clients.map((c) => (c.id === clientId ? rec : c))
        : [...s.clients, rec],
    },
    id: clientId,
  }
}
export function saveContacts(
  s: StaffSnapshot,
  role: PreviewRole,
  id: string,
  contacts: ClientContact[],
) {
  requireManagement(role)
  assertValid(validateContacts(contacts))
  if (!s.clients.some((c) => c.id === id))
    throw new Error("Client unavailable.")
  return {
    ...s,
    clients: s.clients.map((c) =>
      c.id === id ? { ...c, contacts: contacts.map((k) => ({ ...k })) } : c,
    ),
  }
}
export function transferClient(
  s: StaffSnapshot,
  role: PreviewRole,
  id: string,
  houseId: string,
  confirmed: boolean,
) {
  requireManagement(role)
  if (
    confirmed !== true ||
    !s.clients.some((c) => c.id === id) ||
    !s.houses.some((h) => h.id === houseId && h.status !== "Inactive")
  )
    throw new Error("Confirm a transfer to an existing active house.")
  return {
    ...s,
    clients: s.clients.map((c) => (c.id === id ? { ...c, houseId } : c)),
  }
}
export const employeeHouses = (s: StaffSnapshot, id: string) =>
  s.assignments.filter((a) => a.employeeId === id).map((a) => a.houseId)
export function dashboardSummary(s: StaffSnapshot) {
  const today = s.shifts.filter(
    (sh) => sh.status !== "cancelled" && nzDay(sh.start) === nzDay(s.now),
  )
  return {
    activeEmployees: s.staff.filter((e) => (e.status ?? "Active") === "Active")
      .length,
    houses: s.houses.filter((h) => h.status !== "Inactive").length,
    clients: s.clients.filter((c) => c.status !== "Inactive").length,
    today,
    clockedIn: s.attendance
      .map((a) => effectiveAttendance(s, a))
      .filter((a) => a.clockIn && !a.clockOut).length,
    corrections:
      s.corrections.filter((c) => c.status === "pending").length +
      s.attendanceCorrections.filter((c) => c.status === "pending").length,
    leave: s.leaveRequests.filter((l) => l.status === "pending").length,
    concerns: s.concerns.filter((c) =>
      ["Submitted", "Under Review"].includes(c.status),
    ).length,
  }
}
