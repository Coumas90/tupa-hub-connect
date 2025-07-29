import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface RateLimitGuardProps {
  children: React.ReactNode;
  action: string;
  identifier?: string;
  limit?: number;
  windowMinutes?: number;
  onRateLimited?: () => void;
}

export function RateLimitGuard({
  children,
  action,
  identifier,
  limit = 5,
  windowMinutes = 60,
  onRateLimited,
}: RateLimitGuardProps) {
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkRateLimit();
  }, [action, identifier]);

  const checkRateLimit = async () => {
    try {
      setIsChecking(true);
      
      // Determine identifier (user ID, IP, or anonymous)
      const { data: { user } } = await supabase.auth.getUser();
      const effectiveIdentifier = identifier || user?.id || 'anonymous';

      const { data: allowed, error } = await supabase.rpc('check_rate_limit', {
        p_identifier: effectiveIdentifier,
        p_action: action,
        p_limit: limit,
        p_window_minutes: windowMinutes,
      });

      if (error) {
        console.error('Rate limit check failed:', error);
        // Allow by default if check fails
        setIsRateLimited(false);
        return;
      }

      const rateLimited = !allowed;
      setIsRateLimited(rateLimited);
      
      if (rateLimited && onRateLimited) {
        onRateLimited();
      }
    } catch (error) {
      console.error('Rate limit guard error:', error);
      // Allow by default if check fails
      setIsRateLimited(false);
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="ml-2 text-sm text-muted-foreground">Verificando límites...</span>
      </div>
    );
  }

  if (isRateLimited) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Has excedido el límite de intentos para esta acción. 
          Intenta nuevamente en {windowMinutes} minutos.
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}