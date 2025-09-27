import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
});

const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.issues.forEach((err: z.ZodIssue) => {
        console.error(`  ${err.path.join('.')}: ${err.message}`);
      });

      // Only exit process on server side
      if (typeof window === 'undefined') {
        process.exit(1);
      } else {
        // On client side, throw an error instead
        throw new Error('Environment validation failed. Check console for details.');
      }
    }
    throw error;
  }
};

// Use a safer approach for client-side environment validation
const createEnv = () => {
  if (typeof window === 'undefined') {
    // Server side - use full validation
    return parseEnv();
  } else {
    // Client side - only validate public env vars that are available
    const clientEnvSchema = z.object({
      NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
      NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),
      NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
    });

    try {
      return clientEnvSchema.parse({
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
        NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('❌ Client environment validation failed:');
        error.issues.forEach((err: z.ZodIssue) => {
          console.error(`  ${err.path.join('.')}: ${err.message}`);
        });
        throw new Error('Client environment validation failed');
      }
      throw error;
    }
  }
};

export const env = createEnv();
export type Env = z.infer<typeof envSchema>;