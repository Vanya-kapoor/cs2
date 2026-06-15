import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),

  GOOGLE_API_KEY: z.string().min(1, 'GOOGLE_API_KEY is required'),

  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 chars'),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:5000'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET is required'),

  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().min(1, 'SMTP_USER is required'),
  SMTP_PASS: z.string().min(1, 'SMTP_PASS is required'),
  EMAIL_FROM: z.string().email('EMAIL_FROM must be a valid email'),
  EMAIL_FROM_NAME: z.string().default('FAQ System'),
  SYSTEM_ADMIN_ID: z.string().optional(),

  // Rate Limiting (optional, all have safe defaults)
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),     // 15 minutes
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 minutes
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(15),
  CHAT_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),  // 1 minute
  CHAT_RATE_LIMIT_MAX: z.coerce.number().default(5),
  QUERY_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 minutes
  QUERY_RATE_LIMIT_MAX: z.coerce.number().default(5),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof parsed.data;