import { createClient } from '@supabase/supabase-js';
import { getOperatorIdentity } from './auth';

const supabaseUrl = import.meta.env.VITE_AXIM_CORE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_AXIM_CORE_ANON_KEY || '';

// Custom fetch to intercept Cloudflare Zero Trust edge blocks
const customFetch = async (url, options) => {
  let response = await fetch(url, options);
  if (response.status === 401 || response.status === 403) {
    console.warn('[CLOUDFLARE_EDGE_BLOCK] Unauthorized access intercepted. Attempting silent token validation check...');
    const identity = await getOperatorIdentity();
    if (identity) {
      console.log(`[AXiM_CORE] Silent token check valid for identity: ${identity}. Retrying request...`);
      response = await fetch(url, options);
      if (response.status === 401 || response.status === 403) {
        console.error('[CLOUDFLARE_EDGE_BLOCK] Retry failed. Unauthorized access intercepted by Zero Trust.');
        throw new Error('CLOUDFLARE_EDGE_BLOCK');
      }
    } else {
      console.error('[CLOUDFLARE_EDGE_BLOCK] Token health check failed. Unauthorized access intercepted by Zero Trust.');
      throw new Error('CLOUDFLARE_EDGE_BLOCK');
    }
  }
  return response;
};

// Connection to the central macro-ecosystem with Edge interception
export const aximCoreClient = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: customFetch }
});
