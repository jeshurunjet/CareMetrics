import "server-only"
import { createHmac } from "node:crypto"
import { database } from "../db"
import { backendEnvironment } from "../config/backend"
export async function allowLogin(email: string): Promise<boolean> {
  const db = database()
  const secret = backendEnvironment().secret
  const now = new Date()
  // Expired HMAC buckets contain no plaintext address and are removed on subsequent attempts.
  await db.loginAttempt.deleteMany({ where: { expiresAt: { lt: now } } })
  for (const [label, limit, duration] of [
    ["global", 200, 60000],
    [email, 5, 900000],
  ] as const) {
    const key = createHmac("sha256", secret)
      .update(`login:${label}`)
      .digest("hex")
    const expires = new Date(now.getTime() + duration)
    const rows = await db.$queryRaw<{ attempts: number }[]>`
      INSERT INTO "LoginAttempt" ("key", "attempts", "expiresAt") VALUES (${key}, 1, ${expires})
      ON CONFLICT ("key") DO UPDATE SET
        "attempts" = CASE WHEN "LoginAttempt"."expiresAt" <= ${now} THEN 1 ELSE "LoginAttempt"."attempts" + 1 END,
        "expiresAt" = CASE WHEN "LoginAttempt"."expiresAt" <= ${now} THEN ${expires} ELSE "LoginAttempt"."expiresAt" END
      WHERE "LoginAttempt"."expiresAt" <= ${now} OR "LoginAttempt"."attempts" < ${limit}
      RETURNING "attempts"`
    if (!rows.length) return false
  }
  return true
}
