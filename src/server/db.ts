import "server-only"
import { PrismaClient } from "@/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { attachDatabasePool } from "@vercel/functions"
import { backendEnvironment } from "./config/backend"
const globalDb = globalThis as unknown as { caremetricsDb?: PrismaClient }
export function database(): PrismaClient {
  const { databaseUrl } = backendEnvironment()
  if (!globalDb.caremetricsDb) {
    const pool = new Pool({
      connectionString: databaseUrl,
      max: 5,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
    })
    if (process.env.VERCEL) attachDatabasePool(pool)
    globalDb.caremetricsDb = new PrismaClient({
      adapter: new PrismaPg(pool, {
        disposeExternalPool: true,
        onPoolError() {
          console.error("Database connection unavailable")
        },
      }),
      log: [],
    })
  }
  return globalDb.caremetricsDb
}
