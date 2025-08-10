// Centralized Auth effects (singleton)
import { supabase } from '@/lib/supabase';

export type AuthEvent = Parameters<Parameters<typeof supabase.auth.onAuthStateChange>[0]>[0];
export type AuthSession = Parameters<Parameters<typeof supabase.auth.onAuthStateChange>[0]>[1];
export type AuthListener = (event: AuthEvent, session: AuthSession) => void;

let unsubscribe: (() => void) | null = null;
const listeners = new Set<AuthListener>();

export function registerAuthEffectsOnce() {
  if (unsubscribe) return unsubscribe; // singleton

  const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
    // Global side-effects dispatch point
    // (telemetry, caches, etc.)
    for (const cb of Array.from(listeners)) {
      try { cb(event, session); } catch (e) { console.error('Auth listener error:', e); }
    }
  });

  unsubscribe = () => sub.subscription.unsubscribe();
  return unsubscribe;
}

export function addAuthListener(cb: AuthListener) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
