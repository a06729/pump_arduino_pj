import type { Config } from "drizzle-kit";

export default {
  schema: "./electron/db/schema/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: "./data/database.db",
  },
} satisfies Config;