import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Clock } from 'lucide-react';

interface RateLimitGuardProps {
  children: React.ReactNode;
  action: string;
  identifier?: string;
  limit?: number;
  windowMinutes?: number;
  onRateLimited?: () => void;
}

const RateLimitGuard: React.FC<RateLimitGuardProps> = ({
  children,
  action,
  identifier,
  limit = 5,
  windowMinutes = 60,
  onRateLimited
}) => {
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkRateLimit();
  }, [action, identifier]);

  const checkRateLimit = async () => {
    try {
      setIsChecking(true);
      
      // Use IP address or user ID as identifier
      const currentIdentifier = identifier || 
        (await supabase.auth.getUser()).data.user?.id || 
        'anonymous';

      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_identifier: currentIdentifier,
        p_action: action,
        p_limit: limit,
        p_window_minutes: windowMinutes
      });

      if (error) {
        console.error('Rate limit check failed:', error);
        // Allow through on error to avoid blocking users
        setIsRateLimited(false);
      } else {
        setIsRateLimited(!data);
        if (!data && onRateLimited) {
          onRateLimited();
        }
      }
    } catch (error) {
      console.error('Rate limit guard error:', error);
      setIsRateLimited(false);
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isRateLimited) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Rate limit exceeded for {action}. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
};

export default RateLimitGuard;