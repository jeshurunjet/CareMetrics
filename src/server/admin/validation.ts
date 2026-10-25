import "server-only"
import { entityId } from "../errors"
export class ManagementError extends Error {
  constructor(
    public status: 400 | 409,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message)
  }
}
export function invalid(field: string, message: string): never {
  throw new ManagementError(400, "Check the highlighted information.", {
    [field]: message,
  })
}
export function object(
  input: unknown,
  keys: string[],
): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input))
    invalid("form", "Invalid request.")
  const data = input as Record<string, unknown>
  if (Object.keys(data).some((k) => !keys.includes(k)))
    invalid("form", "Unsupported request fields.")
  return data
}
export function text(
  data: Record<string, unknown>,
  key: string,
  max: number,
  required = false,
): string {
  const value = data[key]
  if (
    typeof value !== "string" ||
    value.length > max ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)
  )
    invalid(key, "Enter a valid value.")
  const clean = value.trim()
  if (required && !clean) invalid(key, "This field is required.")
  return clean
}
export function boolean(data: Record<string, unknown>, key: string): boolean {
  if (typeof data[key] !== "boolean") invalid(key, "Choose a valid value.")
  return data[key] as boolean
}
export function email(data: Record<string, unknown>, required = false): string {
  const value = text(data, "email", 254, required).toLowerCase()
  if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
    invalid("email", "Enter a valid email address.")
  return value
}
export function phone(data: Record<string, unknown>): string {
  const value = text(data, "phone", 40)
  if (value && !/^[+\d() .-]{3,40}$/.test(value))
    invalid("phone", "Enter a valid phone number.")
  return value
}
export function ids(value: unknown): string[] {
  if (
    !Array.isArray(value) ||
    value.length > 200 ||
    new Set(value).size !== value.length
  )
    invalid("houseIds", "Choose valid unique records.")
  return value.map(entityId)
}
export function expected(input: unknown, current: Date) {
  if (typeof input !== "string" || input !== current.toISOString())
    throw new ManagementError(
      409,
      "This record changed. Refresh and review your changes before saving.",
    )
}
export function dateOnly(value: string): Date | null {
  if (!value) return null
  const d = new Date(value + "T00:00:00Z")
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Pacific/Auckland",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(d.getTime()) ||
    d.toISOString().slice(0, 10) !== value ||
    value > today
  )
    invalid(
      "dateOfBirth",
      "Enter a valid date no later than today in New Zealand.",
    )
  return d
}
