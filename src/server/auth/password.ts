import { randomBytes } from "node:crypto"
import { hash, verify, argon2id } from "argon2"
export function hashPassword(password: string) {
  if (password.length < 16 || password.length > 128)
    throw new Error("Password must have 16 to 128 characters")
  return hash(password, {
    type: argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  })
}
let dummy: Promise<string> | undefined
export async function checkPassword(
  password: string,
  passwordHash: string | null,
): Promise<boolean> {
  const target =
    passwordHash ||
    (await (dummy ??= hashPassword(randomBytes(32).toString("base64url"))))
  try {
    return (await verify(target, password)) && passwordHash !== null
  } catch {
    return false
  }
}
