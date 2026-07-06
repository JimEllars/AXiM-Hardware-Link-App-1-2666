import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_AXIM_CORE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_AXIM_CORE_ANON_KEY || '';

// Custom fetch to catch Cloudflare Zero Trust blocks (401, 403)
const customFetch = async (url, options) => {
  const response = await fetch(url, options);

  if (response.status === 401 || response.status === 403) {
    console.error(`[CLOUDFLARE_EDGE_BLOCK] Unauthorized or Forbidden access detected. URL: ${url}`);
  }

  return response;
};

// Connection to the central macro-ecosystem with the custom fetch
export const aximCoreClient = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: customFetch
  }
});
