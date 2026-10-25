"use client"
import type {
  MutationResult,
  MutationFeedback,
  ContactCommand,
} from "./contracts"
import type { ClientContact } from "@/modules/staff/data/types"
const fields: Record<string, string> = {
  name: "first",
  employeeCode: "employeeId",
  houseIds: "houses",
  reference: "ref",
  dateOfBirth: "dob",
  latitude: "lat",
  longitude: "lat",
}
export async function command(
  url: string,
  method: "POST" | "PATCH" | "PUT",
  body: unknown,
): Promise<MutationResult> {
  let response: Response
  try {
    response = await fetch(url, {
      method,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    })
  } catch {
    throw new Error(
      "Changes were not saved. The service is unavailable; please retry.",
    )
  }
  const data = (await response
    .json()
    .catch(() => null)) as MutationResult & MutationFeedback | null
  if (!response.ok) {
    const error = Object.assign(
      new Error(data?.error ?? "Changes were not saved. Please try again."),
      {
        fields: data?.fields
          ? Object.fromEntries(
              Object.entries(data.fields).map(([k, v]) => [fields[k] ?? k, v]),
            )
          : undefined,
      },
    )
    throw error
  }
  if (
    !data ||
    typeof data.id !== "string" ||
    typeof data.updatedAt !== "string"
  )
    throw new Error(
      "Unable to confirm the save. Refresh the record before retrying.",
    )
  return { id: data.id, updatedAt: data.updatedAt }
}
export const roleNames = {
  STAFF: "Support Worker",
  SENIOR_STAFF: "Senior Staff",
  MANAGER: "Manager",
  ADMINISTRATOR: "Administrator",
} as const
export const roleCodes: Record<string, string> = Object.fromEntries(
  Object.entries(roleNames).map(([k, v]) => [v, k]),
)
export const statusNames = {
  ACTIVE: "Active",
  INVITED: "Invited",
  INACTIVE: "Inactive",
} as const
export function contactCommands(
  contacts: ClientContact[],
  original: ClientContact[],
): ContactCommand[] {
  return contacts.map((c) => ({
    ...(original.some((o) => o.id === c.id) ? { id: c.id } : {}),
    name: c.name,
    relationship: c.relation,
    phone: c.phone ?? "",
    email: c.email ?? "",
    isPrimary: !!c.primary,
    isEmergency: !!c.emergency,
  }))
}
