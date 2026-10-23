/** Job titles supported by the fictional Staff UI, not trusted permission grants. */
export const staffJobRoles = [
  "Support Worker",
  "Senior Support Worker",
  "Team Leader",
  "Manager",
  "Administrator",
] as const
export function isStaffPreviewRole(value: unknown) {
  return (
    typeof value === "string" &&
    (staffJobRoles as readonly string[]).includes(value)
  )
}
