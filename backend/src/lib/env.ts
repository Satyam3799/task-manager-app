import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(20),
  // Comma-separated list. Example: "http://localhost:5173,https://myapp.com"
  CORS_ORIGIN: z.string().min(1).default("http://localhost:5173"),
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
});

export const env = envSchema.parse(process.env);

export const corsOrigins = env.CORS_ORIGIN.split(",")
  .map((s) => s.trim())
  .filter(Boolean);

