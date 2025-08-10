// Unified Supabase client with PKCE and cross-subdomain cookies (safe init)
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config';

// Fallbacks to avoid blank screen when ENV isn't injected in preview/builds
const DEFAULT_SUPABASE_URL = 'https://hmmaubkxfewzlypywqff.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtbWF1Ymt4ZmV3emx5cHl3cWZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4ODcwNjAsImV4cCI6MjA2ODQ2MzA2MH0.SahVxttR7FcNfYR7hEL4N-ouOrhydtvPVTkKs_o5jCg';

// Prefer ENV when available, then config, then safe defaults
const url = (import.meta as any)?.env?.VITE_SUPABASE_URL || config.supabase.url || DEFAULT_SUPABASE_URL;
const anon = (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY || config.supabase.anonKey || DEFAULT_SUPABASE_ANON_KEY;

const getCookieDomain = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  const parts = window.location.hostname.split('.');
  return parts.length >= 3 ? `.${parts.slice(-2).join('.')}` : undefined;
};

const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';

export const supabase = createClient(url, anon, {
  auth: {
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    // Cross-subdomain cookies for session sharing between app/admin
    cookieOptions: {
      domain: getCookieDomain(),
      sameSite: 'none',
      secure: isSecure,
    },
  },
} as any);
