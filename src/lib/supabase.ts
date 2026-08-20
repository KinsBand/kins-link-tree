import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.SUPABASE_URL) || (typeof process !== 'undefined' && process.env ? process.env.SUPABASE_URL : '') || '';
const supabaseServiceKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.SUPABASE_SERVICE_ROLE_KEY) || (typeof process !== 'undefined' && process.env ? process.env.SUPABASE_SERVICE_ROLE_KEY : '') || '';

export const supabase = (supabaseUrl && typeof supabaseUrl === 'string' && supabaseUrl.startsWith('http')) 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

