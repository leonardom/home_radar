import "dotenv/config";

import { z } from "zod";

const SocialProviderSchema = z.enum(["google", "facebook"]);

const parseCsv = (value: unknown): string[] => {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0);
};

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
  CLERK_AUTH_MODE: z.enum(["optional", "required"]).default("optional"),
  CLERK_SECRET_KEY: z.string().min(1).optional(),
  CLERK_PUBLISHABLE_KEY: z.string().min(1).optional(),
  CLERK_JWT_KEY: z.string().min(1).optional(),
  CLERK_API_URL: z.string().url().optional(),
  CLERK_SKIP_JWKS_CACHE: z.coerce.boolean().default(false),
  CLERK_ENABLED_SOCIAL_PROVIDERS: z.preprocess(parseCsv, z.array(SocialProviderSchema)).default([]),
  ENFORCE_MIN_ONE_FILTER: z.coerce.boolean().default(false),
  EMAIL_FROM: z.string().email().default("no-reply@home-radar.local"),
  SENDGRID_API_KEY: z.string().min(1).optional(),
  NOTIFICATIONS_MAX_ATTEMPTS: z.coerce.number().int().positive().default(3),
});

const REQUIRED_CLERK_SOCIAL_PROVIDERS = ["google", "facebook"] as const;

type ParsedEnv = z.infer<typeof EnvSchema>;

export type ClerkReadiness = {
  mode: ParsedEnv["CLERK_AUTH_MODE"];
  publishableKeyConfigured: boolean;
  verificationMethod: "none" | "secret_key" | "jwt_key" | "secret_and_jwt";
  enabledSocialProviders: ParsedEnv["CLERK_ENABLED_SOCIAL_PROVIDERS"];
  providers: {
    google: boolean;
    facebook: boolean;
  };
  ready: boolean;
  issues: string[];
};

export const evaluateClerkReadiness = (config: ParsedEnv): ClerkReadiness => {
  const hasPublishableKey = Boolean(config.CLERK_PUBLISHABLE_KEY);
  const hasSecretKey = Boolean(config.CLERK_SECRET_KEY);
  const hasJwtKey = Boolean(config.CLERK_JWT_KEY);
  const providers = new Set(config.CLERK_ENABLED_SOCIAL_PROVIDERS);

  const verificationMethod: ClerkReadiness["verificationMethod"] = hasSecretKey
    ? hasJwtKey
      ? "secret_and_jwt"
      : "secret_key"
    : hasJwtKey
      ? "jwt_key"
      : "none";

  const issues: string[] = [];
  if (!hasPublishableKey) {
    issues.push("CLERK_PUBLISHABLE_KEY is missing");
  }

  if (!hasSecretKey && !hasJwtKey) {
    issues.push("One of CLERK_SECRET_KEY or CLERK_JWT_KEY must be configured");
  }

  for (const provider of REQUIRED_CLERK_SOCIAL_PROVIDERS) {
    if (!providers.has(provider)) {
      issues.push(`CLERK_ENABLED_SOCIAL_PROVIDERS is missing '${provider}'`);
    }
  }

  return {
    mode: config.CLERK_AUTH_MODE,
    publishableKeyConfigured: hasPublishableKey,
    verificationMethod,
    enabledSocialProviders: config.CLERK_ENABLED_SOCIAL_PROVIDERS,
    providers: {
      google: providers.has("google"),
      facebook: providers.has("facebook"),
    },
    ready: issues.length === 0,
    issues,
  };
};

const parsedEnv = EnvSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error(
    `Invalid environment variables: ${JSON.stringify(parsedEnv.error.flatten().fieldErrors)}`,
  );
}

const shouldEnforceClerkReadiness =
  parsedEnv.data.CLERK_AUTH_MODE === "required" || parsedEnv.data.NODE_ENV === "production";

if (shouldEnforceClerkReadiness) {
  const clerkReadiness = evaluateClerkReadiness(parsedEnv.data);

  if (!clerkReadiness.ready) {
    throw new Error(
      `Invalid Clerk configuration for '${parsedEnv.data.NODE_ENV}' (${parsedEnv.data.CLERK_AUTH_MODE} mode): ${clerkReadiness.issues.join(
        "; ",
      )}`,
    );
  }
}

export const env = parsedEnv.data;
