import { z } from "zod";

const optionalString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().optional()
);
const optionalUrl = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().url().optional()
);
const optionalS3Encryption = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.enum(["AES256", "aws:kms"]).optional()
);
const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(4000),
    WEB_ORIGIN: z.string().url().default("http://localhost:5173"),
    CORS_ALLOWED_ORIGINS: optionalString,
    COOKIE_DOMAIN: optionalString,
    COOKIE_SAME_SITE: z.enum(["lax", "none", "strict"]).default("lax"),
    DATABASE_URL: z.string().min(1),
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    ACCESS_TOKEN_TTL: z.enum(["5m", "10m", "15m", "30m"]).default("15m"),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
    ADMIN_EMAIL_2FA: z
      .enum(["true", "false"])
      .default(process.env.NODE_ENV === "production" ? "true" : "false")
      .transform((value) => value === "true"),
    RESEND_API_KEY: optionalString,
    SMTP_HOST: optionalString,
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_USER: optionalString,
    SMTP_PASSWORD: optionalString,
    SMTP_FROM: z.string().default("Serhii Dev Studio <no-reply@example.com>"),
    SETTINGS_ENCRYPTION_KEY: optionalString,
    FILE_STORAGE: z.enum(["local", "s3"]).default("local"),
    S3_ENDPOINT: optionalUrl,
    S3_REGION: z.string().default("auto"),
    S3_BUCKET: optionalString,
    S3_ACCESS_KEY_ID: optionalString,
    S3_SECRET_ACCESS_KEY: optionalString,
    S3_FORCE_PATH_STYLE: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    S3_SERVER_SIDE_ENCRYPTION: optionalS3Encryption,
    S3_KMS_KEY_ID: optionalString,
    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),
    SERVICE_VERSION: z
      .string()
      .max(100)
      .default(process.env.RENDER_GIT_COMMIT ?? "development")
  })
  .superRefine((value, context) => {
    const origins = [
      value.WEB_ORIGIN,
      ...(value.CORS_ALLOWED_ORIGINS?.split(",").map((origin) => origin.trim()) ?? [])
    ];
    for (const origin of origins) {
      try {
        const url = new URL(origin);
        if (value.NODE_ENV === "production" && url.protocol !== "https:") {
          context.addIssue({
            code: "custom",
            path: ["CORS_ALLOWED_ORIGINS"],
            message: "Production web origins must use HTTPS"
          });
        }
      } catch {
        context.addIssue({
          code: "custom",
          path: ["CORS_ALLOWED_ORIGINS"],
          message: `Invalid web origin: ${origin}`
        });
      }
    }
    if (value.NODE_ENV !== "production") return;
    if (value.FILE_STORAGE !== "s3" || !value.S3_BUCKET) {
      context.addIssue({
        code: "custom",
        path: ["FILE_STORAGE"],
        message: "Production requires S3-compatible file storage and S3_BUCKET"
      });
    }
    if (!value.ADMIN_EMAIL_2FA) {
      context.addIssue({
        code: "custom",
        path: ["ADMIN_EMAIL_2FA"],
        message: "Production requires email second-factor verification for admin sign-in"
      });
    }
    if (!value.S3_ACCESS_KEY_ID || !value.S3_SECRET_ACCESS_KEY) {
      context.addIssue({
        code: "custom",
        path: ["S3_ACCESS_KEY_ID"],
        message: "Production requires both S3 access key credentials"
      });
    }
    if (!value.RESEND_API_KEY && !(value.SMTP_HOST && value.SMTP_USER && value.SMTP_PASSWORD)) {
      context.addIssue({
        code: "custom",
        path: ["RESEND_API_KEY"],
        message: "Production requires Resend or complete SMTP credentials"
      });
    }
    if (
      !value.SETTINGS_ENCRYPTION_KEY ||
      Buffer.from(value.SETTINGS_ENCRYPTION_KEY, "base64").length !== 32
    ) {
      context.addIssue({
        code: "custom",
        path: ["SETTINGS_ENCRYPTION_KEY"],
        message: "Production requires a base64-encoded 32-byte settings encryption key"
      });
    }
    if (value.S3_SERVER_SIDE_ENCRYPTION === "aws:kms" && !value.S3_KMS_KEY_ID) {
      context.addIssue({
        code: "custom",
        path: ["S3_KMS_KEY_ID"],
        message: "S3_KMS_KEY_ID is required when using aws:kms encryption"
      });
    }
  });

export const env = schema.parse(process.env);
export const isProduction = env.NODE_ENV === "production";
export const allowedWebOrigins = new Set([
  env.WEB_ORIGIN,
  ...(env.CORS_ALLOWED_ORIGINS?.split(",").map((origin) => origin.trim()) ?? [])
]);
