// Unified Supabase client with PKCE and cross-subdomain cookies
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config';

// Prefer ENV when available, otherwise fallback to config.supabase
const url = (import.meta as any)?.env?.VITE_SUPABASE_URL || config.supabase.url;
const anon = (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY || config.supabase.anonKey;

export const supabase = createClient(url, anon, {
  auth: {
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    // Cross-subdomain cookies for session sharing between app/admin
    cookieOptions: {
      domain: (() => {
        const parts = window.location.hostname.split('.');
        return parts.length >= 3 ? `.${parts.slice(-2).join('.')}` : undefined;
      })(),
      sameSite: 'none',
      secure: window.location.protocol === 'https:',
    },
  },
} as any);
