import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_URL: z.string().min(1),
  MONGO_URI: z.string().min(1),
  DATABASE_NAME: z.string().min(1),
  JWT_ACCESS_SECRET_KEY: z.string().min(16).optional(),
  JWT_REFRESH_SECRET_KEY: z.string().min(16).optional(),
  JWT_ACCESS_SECRET: z.string().min(16).optional(),
  JWT_REFRESH_SECRET: z.string().min(16).optional(),
  JWT_SECRET_KEY: z.string().min(16).optional(),
  JWT_ACCESS_TOKEN_EXPIRES: z.string().default("15m"),
  JWT_REFRESH_TOKEN_EXPIRES: z.string().default("7d"),
  BREVO_API_KEY: z.string().min(1),
  BREVO_SENDER_EMAIL: z.string().email(),
  BREVO_SENDER_NAME: z.string().min(1),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  GROQ_API_KEY: z.string().min(1).optional(),
  AI_MODEL: z.string().min(1).default("meta-llama/llama-4-scout-17b-16e-instruct"),
  AI_SHORTLIST_THRESHOLD: z.coerce.number().min(0).max(100).default(50),
});

export const validateEnv = () => {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Environment validation failed: ${details}`);
  }

  const values = parsed.data;
  const accessSecret = values.JWT_ACCESS_SECRET_KEY || values.JWT_ACCESS_SECRET || values.JWT_SECRET_KEY;
  const refreshSecret = values.JWT_REFRESH_SECRET_KEY || values.JWT_REFRESH_SECRET || values.JWT_SECRET_KEY;

  if (values.NODE_ENV === "production") {
    if (!values.BREVO_SENDER_EMAIL || !values.BREVO_SENDER_NAME) {
      throw new Error("Production Error: BREVO_SENDER_EMAIL and BREVO_SENDER_NAME are required");
    }
    if (!values.JWT_ACCESS_SECRET_KEY && !values.JWT_ACCESS_SECRET) {
      throw new Error("Production Error: JWT_ACCESS_SECRET_KEY or JWT_ACCESS_SECRET is required");
    }
    if (!values.JWT_REFRESH_SECRET_KEY && !values.JWT_REFRESH_SECRET) {
      throw new Error("Production Error: JWT_REFRESH_SECRET_KEY or JWT_REFRESH_SECRET is required");
    }
    if (accessSecret === refreshSecret) {
      throw new Error("Production Error: Access and Refresh secrets must be different");
    }
  } else {
    if (!accessSecret || !refreshSecret) {
      throw new Error(
        "Environment validation failed: define JWT_ACCESS_SECRET_KEY/JWT_ACCESS_SECRET and JWT_REFRESH_SECRET_KEY/JWT_REFRESH_SECRET (or JWT_SECRET_KEY fallback)",
      );
    }
  }

  return values;
};

export const getJwtSecrets = () => {
  const accessSecret =
    process.env.JWT_ACCESS_SECRET_KEY || process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET_KEY;
  const refreshSecret =
    process.env.JWT_REFRESH_SECRET_KEY || process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET_KEY;

  if (!accessSecret || !refreshSecret) {
    throw new Error("JWT secrets are not configured");
  }

  return { accessSecret, refreshSecret };
};
