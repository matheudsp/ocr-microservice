import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  // Server
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.coerce.number().default(3000),

  // App
  OCR_THRESHOLD: z.coerce.number().default(0.7),

  // Redis
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  // Database
  DATABASE_URL: z.string(),

  // MinIO
  MINIO_ENDPOINT: z.string().default("localhost"),
  MINIO_PORT: z.coerce.number().default(9000),
  MINIO_ACCESS_KEY: z.string().min(1),
  MINIO_SECRET_KEY: z.string().min(1),
  MINIO_BUCKET: z.string().default("docs"),

  MINIO_USE_SSL: z
    .string()
    .default("false")
    .transform((val) => val === "true"),

  // GCP
  USE_GOOGLE_VISION: z
    .string()
    .default("false")
    .transform((val) => val === "true"),

  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),

  // Logger
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .default("info"),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("Variáveis de ambiente inválidas:");

  const errors = _env.error.flatten().fieldErrors;

  console.error(JSON.stringify(errors, null, 2));

  process.exit(1);
}

export const env = _env.data;
