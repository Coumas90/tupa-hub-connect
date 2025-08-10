import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    let navigated = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    const complete = (path: string) => {
      if (cancelled || navigated) return;
      navigated = true;
      navigate(path, { replace: true });
    };

    // 1) Handle explicit error from provider
    try {
      const url = new URL(window.location.href);
      const err = url.searchParams.get('error') || url.searchParams.get('error_description');
      if (err) {
        console.error('[AuthCallback] Provider error:', err);
        complete('/login');
        return;
      }
    } catch {}

    // 2) Quick retries to catch session propagation
    let attempts = 0;
    const maxAttempts = 10;
    const intervalMs = 200;

    const tryGetSession = async () => {
      if (cancelled || navigated) return;
      const { data } = await supabase.auth.getSession();
      if (cancelled || navigated) return;
      if (data?.session) {
        complete('/dashboard');
        return;
      }
      attempts += 1;
      if (attempts < maxAttempts) {
        retryTimer = setTimeout(tryGetSession, intervalMs);
      }
    };

    tryGetSession();

    // 3) Listen for auth state changes (do not call supabase APIs here)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled || navigated) return;
      if (session) {
        complete('/dashboard');
      }
    });

    // 4) Final fallback to login if nothing happens
    fallbackTimer = setTimeout(() => {
      if (!navigated) complete('/login');
    }, 5000);

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (fallbackTimer) clearTimeout(fallbackTimer);
      listener?.subscription?.unsubscribe?.();
    };
  }, [navigate]);

  return null;
}
