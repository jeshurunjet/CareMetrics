import { isStaffPreviewRole } from "../data/permissions"
import type { StaffSnapshot, Employee } from "../data/types"
import type { ProfileInput } from "./types"
export function getMyProfile(s: StaffSnapshot) {
  const employee = s.staff.find((e) => e.id === s.meId)
  return employee && isStaffPreviewRole(employee.role) ? employee : undefined
}
export const editableProfileFields = ["phone", "address", "emergency"] as const
export function validateProfileInput(
  input: unknown,
): Partial<Record<keyof ProfileInput | "form", string>> {
  if (!input || typeof input !== "object" || Array.isArray(input))
    return { form: "Profile changes unavailable." }
  const values = input as Record<string, unknown>,
    errors: Partial<Record<keyof ProfileInput | "form", string>> = {}
  if (
    Object.keys(values).some(
      (k) => !editableProfileFields.includes(k as keyof ProfileInput),
    )
  )
    errors.form =
      "Only mobile phone, home address and emergency contact may be changed."
  if (
    typeof values.phone !== "string" ||
    values.phone.length > 32 ||
    !/^\+?[0-9 ()-]+$/.test(values.phone.trim()) ||
    !/^[0-9]{7,15}$/.test(values.phone.replace(/\D/g, ""))
  )
    errors.phone =
      "Enter a phone number with 7–15 digits (up to 32 characters)."
  if (typeof values.address !== "string" || values.address.trim().length > 240)
    errors.address = "Use up to 240 characters for the home address."
  if (
    typeof values.emergency !== "string" ||
    values.emergency.trim().length > 160
  )
    errors.emergency = "Use up to 160 characters for the emergency contact."
  return errors
}
export function updateMyProfile(
  s: StaffSnapshot,
  input: unknown,
): StaffSnapshot {
  const employee = getMyProfile(s)
  if (!employee || Object.keys(validateProfileInput(input)).length)
    throw new Error("Profile changes unavailable")
  const form = input as ProfileInput
  return {
    ...s,
    staff: s.staff.map((e) =>
      e.id === employee.id
        ? {
            ...e,
            phone: form.phone.trim(),
            address: form.address.trim(),
            emergency: form.emergency.trim(),
          }
        : e,
    ),
  }
}
/** Coworkers retain the existing operational identity projection, never private contact/account fields. */
export function projectEmployee(employee: Employee, meId: string): Employee {
  if (employee.id === meId) return { ...employee }
  const { id, name, role, employeeId, email, photo } = employee
  return { id, name, role, employeeId, email, photo }
}
