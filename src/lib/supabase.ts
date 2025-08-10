// Unified Supabase client with PKCE and cross-subdomain cookies
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL!;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY!;

function baseDomainFromHost(host: string): string | undefined {
  const parts = host.split('.');
  return parts.length >= 3 ? `.${parts.slice(-2).join('.')}` : undefined;
}

export const supabase = createClient(url, anon, {
  auth: {
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
});
