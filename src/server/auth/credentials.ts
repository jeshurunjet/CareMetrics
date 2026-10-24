import "server-only"
import { database } from "../db"
import { allowLogin } from "./throttle"
import { checkPassword } from "./password"
export function loginInput(value: Partial<Record<string, unknown>>) {
  const email =
    typeof value.email === "string" ? value.email.trim().toLowerCase() : ""
  const password = typeof value.password === "string" ? value.password : ""
  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !password ||
    password.length > 1024
  )
    return null
  return { email, password }
}
export async function authenticateCredentials(
  value: Partial<Record<string, unknown>>,
) {
  const input = loginInput(value)
  if (!input || !(await allowLogin(input.email))) return null
  const employee = await database().user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      passwordHash: true,
      status: true,
      sessionVersion: true,
      organisation: { select: { active: true } },
    },
  })
  const valid = await checkPassword(
    input.password,
    employee?.passwordHash ?? null,
  )
  if (
    !employee ||
    !valid ||
    employee.status !== "ACTIVE" ||
    !employee.organisation.active
  )
    return null
  return { id: employee.id, sessionVersion: employee.sessionVersion }
}
