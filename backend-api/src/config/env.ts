import "dotenv/config";

import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().min(1).default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.url(),
  SCRAPER_DATABASE_URL: z.url().optional(),
  SCRAPER_SYNC_BATCH_SIZE: z.coerce.number().int().positive().default(200),
  SCRAPER_SYNC_RETRY_ATTEMPTS: z.coerce.number().int().positive().default(3),
  JWT_ACCESS_SECRET: z.string().min(32).default("dev_access_secret_change_me_1234567890"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_DAYS: z.coerce.number().int().positive().default(7),
  ENFORCE_MIN_ONE_FILTER: z.coerce.boolean().default(false),
  EMAIL_FROM: z.string().email().default("no-reply@home-radar.local"),
  SENDGRID_API_KEY: z.string().min(1).optional(),
});

const parsedEnv = EnvSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error(
    `Invalid environment variables: ${JSON.stringify(parsedEnv.error.flatten().fieldErrors)}`,
  );
}

export const env = parsedEnv.data;
