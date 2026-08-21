import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] || '';
  }
  return '';
};

const supabaseUrl = getEnv('SUPABASE_URL') || getEnv('PUBLIC_SUPABASE_URL');
const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('PUBLIC_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY');

export const supabase = (supabaseUrl && typeof supabaseUrl === 'string' && supabaseUrl.startsWith('http') && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    })
  : null;
