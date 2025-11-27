import { defineConfig } from "drizzle-kit";
import { env } from "./src/infra/config/env";

export default defineConfig({
  schema: "./src/infra/config/drizzle/schema.ts",
  out: "./src/infra/config/drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
