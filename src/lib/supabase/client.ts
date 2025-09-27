import { createBrowserClient } from '@supabase/ssr';
import { env } from '@/lib/utils/env';
import type { Database } from '@/types/database.types';

export const createClient = () => {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};

export const supabase = createClient();