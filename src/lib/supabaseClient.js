import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_AXIM_CORE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_AXIM_CORE_ANON_KEY || '';

// Connection to the central macro-ecosystem
export const aximCoreClient = createClient(supabaseUrl, supabaseAnonKey);
