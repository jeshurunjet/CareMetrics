import { config } from "dotenv"
import { databaseConnection } from "./src/server/config/database-url"
config({ path: [".env.local", ".env"], quiet: true })
const directUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DIRECT_URL
import { defineConfig } from "prisma/config"
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  datasource: {
    url: directUrl ? databaseConnection(directUrl, true) : undefined,
  },
})
