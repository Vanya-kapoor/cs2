import { z } from 'zod';

const envSchema = z.object({
  // ─── Node Environment ───────────────────────────────────────────────
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(5000),

  // ─── Database ───────────────────────────────────────────────────────
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),

  // ─── Authentication - betterAuth ─────────────────────────────────────
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, 'BETTER_AUTH_SECRET must be at least 32 chars')
    .describe('Generate with: openssl rand -base64 32'),
  BETTER_AUTH_URL: z
    .string()
    .url()
    .default('http://localhost:5000')
    .describe('Base URL for auth callbacks (e.g., http://localhost:5000)'),

  // ─── Google OAuth ───────────────────────────────────────────────────
  GOOGLE_CLIENT_ID: z
    .string()
    .min(1, 'GOOGLE_CLIENT_ID is required')
    .describe(
      'Get from Google Cloud Console: https://console.cloud.google.com',
    ),
  GOOGLE_CLIENT_SECRET: z
    .string()
    .min(1, 'GOOGLE_CLIENT_SECRET is required')
    .describe('Get from Google Cloud Console'),

  // ─── API & Frontend ─────────────────────────────────────────────────
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:3000')
    .describe('Frontend URL for CORS'),

  // ─── LLM & AI ───────────────────────────────────────────────────────
  GOOGLE_API_KEY: z
    .string()
    .min(1, 'GOOGLE_API_KEY is required')
    .describe('For Google Generative AI / Gemini'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
