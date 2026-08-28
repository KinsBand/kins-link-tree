import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * SERVER-ONLY Supabase client. Imported exclusively by /api routes.
 * Prefers SUPABASE_SERVICE_ROLE_KEY so writes bypass RLS.
 * Never import this module from anything bundled for the browser.
 */

const getEnv = (key: string): string => {
  let val = '';
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    val = String(process.env[key]);
  } else {
    try {
      if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
        val = String(import.meta.env[key] ?? '');
      }
    } catch (_) {}
  }
  return val.replace(/^["']|["']$/g, '').trim();
};

let cachedClient: SupabaseClient | null = null;

export function getSupabaseServiceClient(): SupabaseClient | null {
  const supabaseUrl =
    getEnv('SUPABASE_URL') ||
    getEnv('PUBLIC_SUPABASE_URL') ||
    getEnv('NEXT_PUBLIC_SUPABASE_URL');

  const supabaseKey =
    getEnv('SUPABASE_SERVICE_ROLE_KEY') ||
    getEnv('SUPABASE_SECRET_KEY') ||
    getEnv('SUPABASE_KEY') ||
    getEnv('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseUrl.startsWith('http') || !supabaseKey) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return cachedClient;
}

/** Back-compat alias for existing API route imports. */
export function getSupabaseClient(): SupabaseClient | null {
  return getSupabaseServiceClient();
}
