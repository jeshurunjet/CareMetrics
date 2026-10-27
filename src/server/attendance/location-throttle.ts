import "server-only"
import { createHmac } from "node:crypto"
import { database } from "../db"
import { backendEnvironment } from "../config/backend"
import { AccessError } from "../errors"
/** Shared PostgreSQL bucket; one authenticated actor, 60 evidence reads/minute. */
export async function limitLocationReads(actorId: string) {
  const now = new Date(),
    expires = new Date(now.getTime() + 60000),
    db = database()
  const key = createHmac("sha256", backendEnvironment().secret)
    .update("location-evidence:" + actorId)
    .digest("hex")
  const rows = await db.$queryRaw<Array<{ attempts: number }>>`
 INSERT INTO "LoginAttempt" ("key","attempts","expiresAt") VALUES (${key},1,${expires})
 ON CONFLICT ("key") DO UPDATE SET
 "attempts"=CASE WHEN "LoginAttempt"."expiresAt"<=${now} THEN 1 ELSE "LoginAttempt"."attempts"+1 END,
 "expiresAt"=CASE WHEN "LoginAttempt"."expiresAt"<=${now} THEN ${expires} ELSE "LoginAttempt"."expiresAt" END
 WHERE "LoginAttempt"."expiresAt"<=${now} OR "LoginAttempt"."attempts"<60
 RETURNING "attempts"`
  if (!rows.length) throw new AccessError(429)
}
