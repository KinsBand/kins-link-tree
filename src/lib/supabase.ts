import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const getEnv = (key: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return String(import.meta.env[key]).trim();
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return String(process.env[key] || '').trim();
  }
  return '';
};

let cachedClient: SupabaseClient | null = null;

/**
 * Returns an active Supabase client instance using available environment variables.
 * Checks for Service Role Key (preferred for server-side endpoints) or Anon Key.
 */
export function getSupabaseClient(): SupabaseClient | null {
  const supabaseUrl =
    getEnv('SUPABASE_URL') ||
    getEnv('NEXT_PUBLIC_SUPABASE_URL') ||
    getEnv('PUBLIC_SUPABASE_URL') ||
    getEnv('VITE_SUPABASE_URL');

  const supabaseKey =
    getEnv('SUPABASE_SERVICE_ROLE_KEY') ||
    getEnv('SUPABASE_SECRET_KEY') ||
    getEnv('SUPABASE_KEY') ||
    getEnv('SUPABASE_ANON_KEY') ||
    getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
    getEnv('SUPABASE_PUBLISHABLE_KEY') ||
    getEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') ||
    getEnv('PUBLIC_SUPABASE_ANON_KEY') ||
    getEnv('VITE_SUPABASE_ANON_KEY');

  if (supabaseUrl && supabaseUrl.startsWith('http') && supabaseKey) {
    if (!cachedClient) {
      cachedClient = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      });
    }
    return cachedClient;
  }

  return null;
}

export const supabase = getSupabaseClient();
