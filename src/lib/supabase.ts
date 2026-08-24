import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * BROWSER Supabase client. Uses ONLY PUBLIC_* variables (safe to ship).
 * Persists the auth session so Google One Tap sign-ins survive reloads.
 *
 * Server-side API routes must import from lib/supabaseServer.ts instead —
 * that module is physically separate so service keys can never reach this bundle.
 */

const readViteEnv = (key: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return String(import.meta.env[key] ?? '').trim();
    }
  } catch (_) {}
  return '';
};

let cachedClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;

  const supabaseUrl =
    readViteEnv('PUBLIC_SUPABASE_URL') ||
    readViteEnv('NEXT_PUBLIC_SUPABASE_URL') ||
    readViteEnv('VITE_SUPABASE_URL');

  const supabaseAnonKey =
    readViteEnv('PUBLIC_SUPABASE_ANON_KEY') ||
    readViteEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
    readViteEnv('PUBLIC_SUPABASE_PUBLISHABLE_KEY') ||
    readViteEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') ||
    readViteEnv('PUBLIC_SUPABASE_KEY') ||
    readViteEnv('VITE_SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseUrl.startsWith('http') || !supabaseAnonKey) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: 'kins-auth',
      },
    });
  }
  return cachedClient;
}

/**
 * Back-compat lazy singleton for legacy imports
 * (`import { supabase } from '../../lib/supabase'`).
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getSupabaseBrowserClient();
    if (!client) return undefined;
    const value = Reflect.get(client as object, prop, receiver);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
