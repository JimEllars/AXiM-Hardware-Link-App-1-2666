import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_AXIM_CORE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_AXIM_CORE_ANON_KEY || '';

// Custom fetch to intercept Cloudflare Zero Trust edge blocks
const customFetch = async (url, options) => {
  const response = await fetch(url, options);
  if (response.status === 401 || response.status === 403) {
    console.error('[CLOUDFLARE_EDGE_BLOCK] Unauthorized access intercepted by Zero Trust.');
    throw new Error('CLOUDFLARE_EDGE_BLOCK');
  }
  return response;
};

// Connection to the central macro-ecosystem with Edge interception
export const aximCoreClient = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: customFetch }
});
