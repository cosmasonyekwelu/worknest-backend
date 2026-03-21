import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_URL: z.string().min(1),
  MONGO_URI: z.string().min(1),
  DATABASE_NAME: z.string().min(1),
  JWT_ACCESS_SECRET_KEY: z.string().min(16),
  JWT_REFRESH_SECRET_KEY: z.string().min(16),
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

  if (values.NODE_ENV === "production") {
    if (!values.BREVO_SENDER_EMAIL || !values.BREVO_SENDER_NAME) {
      throw new Error("Production Error: BREVO_SENDER_EMAIL and BREVO_SENDER_NAME are required");
    }
    if (values.JWT_ACCESS_SECRET_KEY === values.JWT_REFRESH_SECRET_KEY) {
      throw new Error("Production Error: Access and Refresh secrets must be different");
    }
  }

  return values;
};

export const getJwtSecrets = () => {
  const { JWT_ACCESS_SECRET_KEY: accessSecret, JWT_REFRESH_SECRET_KEY: refreshSecret } = process.env;

  if (!accessSecret || !refreshSecret) {
    throw new Error("JWT secrets are not configured");
  }

  return { accessSecret, refreshSecret };
};
