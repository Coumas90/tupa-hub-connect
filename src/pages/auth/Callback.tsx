import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      navigate(data.session ? '/dashboard' : '/login', { replace: true });
    })();
    return () => { cancelled = true; };
  }, [navigate]);

  return null;
}
